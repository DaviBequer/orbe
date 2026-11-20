package io.github.davibequer.orbe;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

/** Abre o site do Orbe e liga a ponte "OrbeAndroid" (cronômetro por cima dos apps e widget). */
public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getBridge().getWebView().addJavascriptInterface(new OrbeBridge(this), "OrbeAndroid");
    }

    @Override
    public void onStart() {
        super.onStart();
        TimerService.setAppVisible(this, true);
    }

    @Override
    public void onStop() {
        super.onStop();
        TimerService.setAppVisible(this, false);
    }
}
