package io.github.davibequer.orbe;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.webkit.JavascriptInterface;

/** Funções que o site chama como window.OrbeAndroid.* */
class OrbeBridge {
    private final Activity act;

    OrbeBridge(Activity act) { this.act = act; }

    /** Lista de cronômetros [{id, t, start, end}] (ISO). Vazia = para tudo. */
    @JavascriptInterface
    public void setTimers(String json) {
        Store.prefs(act).edit().putString("timers", json == null ? "[]" : json).apply();
        TimerService.refresh(act);
    }

    /** Dados do widget {date, done, total, items:[{id, t, m, late, soon}]}. */
    @JavascriptInterface
    public void setWidget(String json) {
        Store.prefs(act).edit().putString("widget", json == null ? "{}" : json).apply();
        TasksWidget.updateAll(act);
    }

    /** Pedidos feitos fora do app (ex.: concluir no widget), em JSON. */
    @JavascriptInterface
    public String takeCmds() { return Store.takeCmds(act); }

    @JavascriptInterface
    public boolean canOverlay() { return Build.VERSION.SDK_INT < 23 || Settings.canDrawOverlays(act); }

    /** Abre a tela do Android "Aparecer sobre outros apps" do Orbe. */
    @JavascriptInterface
    public void askOverlay() {
        act.runOnUiThread(() -> {
            try {
                act.startActivity(new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, Uri.parse("package:" + act.getPackageName())));
            } catch (Exception e) {
                act.startActivity(new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION));
            }
        });
    }

    /** Pede para mostrar notificações (o cronômetro também aparece na barra e na tela de bloqueio). */
    @JavascriptInterface
    public void askNotify() {
        if (Build.VERSION.SDK_INT >= 33 && act.checkSelfPermission(Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED) {
            act.runOnUiThread(() -> act.requestPermissions(new String[] { Manifest.permission.POST_NOTIFICATIONS }, 71));
        }
    }
}
