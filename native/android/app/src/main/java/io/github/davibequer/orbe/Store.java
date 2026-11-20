package io.github.davibequer.orbe;

import android.content.Context;
import android.content.SharedPreferences;
import org.json.JSONArray;
import org.json.JSONObject;

/** Dados que o site entrega para a parte nativa (cronômetros, widget) e pedidos que voltam para o site. */
final class Store {
    private Store() {}

    static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences("orbe", Context.MODE_PRIVATE);
    }

    static JSONArray timers(Context c) {
        try { return new JSONArray(prefs(c).getString("timers", "[]")); } catch (Exception e) { return new JSONArray(); }
    }

    static JSONObject widget(Context c) {
        try { return new JSONObject(prefs(c).getString("widget", "{}")); } catch (Exception e) { return new JSONObject(); }
    }

    /** Guarda um pedido (ex.: tarefa concluída no widget) para o site aplicar quando abrir. */
    static synchronized void addCmd(Context c, JSONObject cmd) {
        try {
            JSONArray a = new JSONArray(prefs(c).getString("cmds", "[]"));
            a.put(cmd);
            prefs(c).edit().putString("cmds", a.toString()).apply();
        } catch (Exception ignored) { }
    }

    static synchronized String takeCmds(Context c) {
        String s = prefs(c).getString("cmds", "[]");
        prefs(c).edit().remove("cmds").apply();
        return s;
    }

    /** Cor do tempo: azul tranquilo, amarelo atenção, vermelho finalizando/passou (igual ao site). */
    static int color(long start, long end, long now) {
        long left = end - now, tot = Math.max(60000, end - start);
        double r = (double) left / tot;
        if (left <= 0 || r <= 0.2 || left <= 5 * 60000) return 0xFFFF5545;
        if (r <= 0.5) return 0xFFF2B705;
        return 0xFF5B9BFF;
    }

    static String clock(long ms) {
        long s = Math.max(0, Math.round(ms / 1000.0)), h = s / 3600, m = (s % 3600) / 60, x = s % 60;
        return h > 0 ? String.format(java.util.Locale.US, "%d:%02d:%02d", h, m, x) : String.format(java.util.Locale.US, "%02d:%02d", m, x);
    }
}
