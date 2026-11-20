package io.github.davibequer.orbe;

import android.content.Context;
import android.content.Intent;
import android.view.View;
import android.widget.RemoteViews;
import android.widget.RemoteViewsService;
import java.util.ArrayList;
import java.util.List;
import org.json.JSONArray;
import org.json.JSONObject;

/** Linhas da lista do widget. */
public class WidgetService extends RemoteViewsService {
    @Override
    public RemoteViewsFactory onGetViewFactory(Intent intent) { return new Factory(getApplicationContext()); }

    static final class Factory implements RemoteViewsFactory {
        private final Context c;
        private final List<JSONObject> items = new ArrayList<>();

        Factory(Context c) { this.c = c; }

        @Override public void onCreate() { }
        @Override public void onDestroy() { items.clear(); }

        @Override
        public void onDataSetChanged() {
            items.clear();
            JSONArray a = Store.widget(c).optJSONArray("items");
            if (a != null) for (int i = 0; i < a.length(); i++) { JSONObject o = a.optJSONObject(i); if (o != null) items.add(o); }
        }

        @Override public int getCount() { return items.size(); }

        @Override
        public RemoteViews getViewAt(int pos) {
            RemoteViews v = new RemoteViews(c.getPackageName(), R.layout.widget_item);
            if (pos >= items.size()) return v;
            JSONObject o = items.get(pos);
            boolean late = o.optBoolean("late"), soon = o.optBoolean("soon");
            v.setTextViewText(R.id.title, o.optString("t"));
            v.setTextColor(R.id.title, late ? 0xFFFF6B5E : soon ? 0xFFF2A33A : 0xFFFFFFFF);
            String m = o.optString("m");
            v.setTextViewText(R.id.meta, m);
            v.setViewVisibility(R.id.meta, m.isEmpty() ? View.GONE : View.VISIBLE);
            v.setImageViewResource(R.id.check, late ? R.drawable.widget_circle_late : R.drawable.widget_circle);
            Intent fill = new Intent().putExtra("id", o.optString("id")).putExtra("subs", o.optInt("subs"));
            v.setOnClickFillInIntent(R.id.check, fill);
            return v;
        }

        @Override public RemoteViews getLoadingView() { return null; }
        @Override public int getViewTypeCount() { return 1; }
        @Override public long getItemId(int pos) { return pos; }
        @Override public boolean hasStableIds() { return false; }
    }
}
