package com.jhotadhari.straymap;

import com.facebook.react.uimanager.ThemedReactContext;
import com.facebook.react.uimanager.ViewGroupManager;

public class BidirectionalScrollHostManager
    extends ViewGroupManager<BidirectionalScrollHost> {

    public static final String REACT_CLASS = "BidirectionalScrollHost";

    @Override
    public String getName() {
        return REACT_CLASS;
    }

    @Override
    protected BidirectionalScrollHost createViewInstance(ThemedReactContext context) {
        return new BidirectionalScrollHost(context);
    }

    @Override
    public boolean needsCustomLayoutForChildren() {
        return false;
    }
}
