package io.github.davibequer.orbe;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

/** Widget "Hoje": o que falta fazer hoje (e o que está atrasado), com círculo para concluir. */
public class TasksWidget extends AppWidgetProvider {
    static final String DONE = "io.github.davibequer.orbe.WIDGET_DONE";

    static void updateAll(Context c) {
        AppWidgetManager m = AppWidgetManager.getInstance(c);
        int[] ids = m.getAppWidgetIds(new ComponentName(c, TasksWidget.class));
        if (ids.length == 0) return;
        for (int id : ids) m.updateAppWidget(id, views(c, id));
        m.notifyAppWidgetViewDataChanged(ids, R.id.list);
    }

    static String today() { return new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date()); }

    static RemoteViews views(Context c, int id) {
        RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_tasks);
        JSONObject w = Store.widget(c);
        int done = w.optInt("done"), total = w.optInt("total");
        boolean stale = !today().equals(w.optString("date"));
        v.setTextViewText(R.id.count, w.length() == 0 ? "abra o Orbe" : stale ? "abra o Orbe para atualizar" : done + " de " + total);
        v.setProgressBar(R.id.prog, Math.max(1, total), done, false);
        Intent svc = new Intent(c, WidgetService.class).putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, id);
        svc.setData(Uri.parse(svc.toUri(Intent.URI_INTENT_SCHEME)));
        v.setRemoteAdapter(R.id.list, svc);
        v.setEmptyView(R.id.list, R.id.empty);
        v.setTextViewText(R.id.empty, w.length() == 0 ? "Abra o Orbe uma vez para aparecer aqui." : "Nada aberto para hoje.");
        Intent tpl = new Intent(c, TasksWidget.class).setAction(DONE);
        v.setPendingIntentTemplate(R.id.list, PendingIntent.getBroadcast(c, 1, tpl, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_MUTABLE));
        Intent open = new Intent(c, MainActivity.class).addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        v.setOnClickPendingIntent(R.id.header, PendingIntent.getActivity(c, 2, open, PendingIntent.FLAG_IMMUTABLE | PendingIntent.FLAG_UPDATE_CURRENT));
        return v;
    }

    @Override
    public void onUpdate(Context c, AppWidgetManager m, int[] ids) {
        for (int id : ids) m.updateAppWidget(id, views(c, id));
        m.notifyAppWidgetViewDataChanged(ids, R.id.list);
    }

    @Override
    public void onReceive(Context c, Intent i) {
        super.onReceive(c, i);
        if (!DONE.equals(i.getAction())) return;
        String id = i.getStringExtra("id");
        if (id == null) return;
        try {
            // tira da lista na hora e guarda o pedido para o site marcar como feita quando abrir
            JSONObject w = Store.widget(c);
            JSONArray items = w.optJSONArray("items"), keep = new JSONArray();
            boolean found = false;
            if (items != null) for (int k = 0; k < items.length(); k++) {
                JSONObject it = items.getJSONObject(k);
                if (id.equals(it.optString("id"))) found = true; else keep.put(it);
            }
            if (!found) return;
            w.put("items", keep);
            w.put("done", w.optInt("done") + 1 + i.getIntExtra("subs", 0));
            Store.prefs(c).edit().putString("widget", w.toString()).apply();
            JSONObject cmd = new JSONObject();
            cmd.put("do", "taskdone");
            cmd.put("id", id);
            cmd.put("at", java.time.Instant.now().toString());
            Store.addCmd(c, cmd);
            updateAll(c);
        } catch (Exception ignored) { }
    }
}
