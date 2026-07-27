package com.jhotadhari.straymap;

import android.content.Context;
import android.view.MotionEvent;
import android.view.VelocityTracker;
import android.view.View;
import android.view.ViewGroup;
import android.widget.OverScroller;
import android.widget.ScrollView;

import com.facebook.react.views.scroll.ReactHorizontalScrollView;

/**
 * Extends React Native's Fabric-compatible {@link ReactHorizontalScrollView}
 * to enable simultaneous two-dimensional scrolling.
 *
 * It intercepts every touch, scrolls itself horizontally, and forwards the
 * vertical component to an inner scrollable — typically the
 * {@code ReactScrollView} backing a React Native {@code FlatList}, or the
 * {@code RecyclerView} backing a {@code FlashList}.
 *
 * The inner scrollable is discovered automatically by walking the view tree
 * (preferring {@link ScrollView}, falling back to any vertically-scrollable
 * {@link ViewGroup}).
 * Set {@code scrollEnabled={false}} on the inner list so it does not
 * compete for the gesture stream.
 */
public class BidirectionalScrollHost extends ReactHorizontalScrollView {

    // ── Touch tracking ───────────────────────────────────────────────────────
    private VelocityTracker velocityTracker;
    private float lastTouchX;
    private float lastTouchY;

    // ── Fling ────────────────────────────────────────────────────────────────
    private OverScroller scroller;

    // ── Child vertical scrollable ────────────────────────────────────────────
    private ViewGroup childScrollView;

    // ── Constructors ─────────────────────────────────────────────────────────

    public BidirectionalScrollHost(Context context) {
        super(context);
        init();
    }

    private void init() {
        scroller = new OverScroller(getContext());
        setVerticalScrollBarEnabled(false);
    }

    // ── Child discovery ──────────────────────────────────────────────────────

    /**
     * Walk the view tree looking for a vertically scrollable child.
     * {@link android.widget.HorizontalScrollView} does NOT extend
     * {@link ScrollView} (both extend {@link android.widget.FrameLayout}),
     * so {@code instanceof ScrollView} correctly excludes this host.
     *
     * Falls back to {@link View#canScrollVertically} when no
     * {@code ScrollView} is found — this covers {@code RecyclerView}
     * (used by FlashList) and other non-ScrollView scrollable containers.
     */
    private ViewGroup findScrollChild(View parent) {
        if (parent instanceof ScrollView) {
            return (ViewGroup) parent;
        }
        if (parent instanceof ViewGroup) {
            ViewGroup group = (ViewGroup) parent;
            for (int i = 0; i < group.getChildCount(); i++) {
                ViewGroup found = findScrollChild(group.getChildAt(i));
                if (found != null) {
                    return found;
                }
            }
            // Fallback for non-ScrollView scrollables (e.g. RecyclerView
            // from FlashList, or any ViewGroup with overflow content).
            if (parent.canScrollVertically(1)
                || parent.canScrollVertically(-1)) {
                return group;
            }
        }
        return null;
    }

    // ── Touch interception ───────────────────────────────────────────────────

    @Override
    public boolean onInterceptTouchEvent(MotionEvent ev) {
        return true;
    }

    @Override
    public void requestDisallowInterceptTouchEvent(boolean disallowIntercept) {
        // no-op — we always intercept
    }

    // ── Touch handling ───────────────────────────────────────────────────────

    @Override
    public boolean onTouchEvent(MotionEvent ev) {
        childScrollView = findScrollChild(this);
        if (childScrollView == null) {
            return false;
        }

        if (velocityTracker == null) {
            velocityTracker = VelocityTracker.obtain();
        }
        velocityTracker.addMovement(ev);

        switch (ev.getActionMasked()) {
            case MotionEvent.ACTION_DOWN: {
                scroller.abortAnimation();
                lastTouchX = ev.getX();
                lastTouchY = ev.getY();
                return true;
            }

            case MotionEvent.ACTION_MOVE: {
                float dx = lastTouchX - ev.getX();
                float dy = lastTouchY - ev.getY();
                lastTouchX = ev.getX();
                lastTouchY = ev.getY();

                // Horizontal: use overScrollBy for native edge-glow
                int maxScrollX = Math.max(0,
                    computeHorizontalScrollRange() - getWidth());
                overScrollBy((int) dx, 0, getScrollX(), 0,
                    maxScrollX, 0, 0, 0, true);

                // Vertical: clamp and forward to child
                int childScrollY = childScrollView.getScrollY();
                int childMaxY = Math.max(0,
                    (childScrollView.getChildCount() > 0
                        ? childScrollView.getChildAt(0).getHeight() : 0) -
                    childScrollView.getHeight());
                int clampedY = Math.max(0,
                    Math.min(childScrollY + (int) dy, childMaxY));
                childScrollView.scrollTo(childScrollView.getScrollX(), clampedY);
                break;
            }

            case MotionEvent.ACTION_UP: {
                velocityTracker.computeCurrentVelocity(1000);
                int vx = (int) velocityTracker.getXVelocity();
                int vy = (int) velocityTracker.getYVelocity();

                int maxX = Math.max(0,
                    computeHorizontalScrollRange() - getWidth());
                int maxY = Math.max(0,
                    (childScrollView.getChildCount() > 0
                        ? childScrollView.getChildAt(0).getHeight() : 0) -
                    childScrollView.getHeight());

                scroller.fling(
                    getScrollX(), childScrollView.getScrollY(),
                    -vx, -vy,
                    0, maxX, 0, maxY,
                    0, 0);

                postInvalidateOnAnimation();
                velocityTracker.recycle();
                velocityTracker = null;
                break;
            }
        }
        return true;
    }

    // ── Fling animation ──────────────────────────────────────────────────────

    @Override
    public void computeScroll() {
        if (scroller.computeScrollOffset()) {
            int newX = scroller.getCurrX();
            int newY = scroller.getCurrY();

            int oldX = getScrollX();
            if (newX != oldX) {
                scrollTo(newX, getScrollY());
            }

            if (childScrollView != null) {
                int oldY = childScrollView.getScrollY();
                if (newY != oldY) {
                    childScrollView.scrollTo(childScrollView.getScrollX(), newY);
                }
            }

            postInvalidateOnAnimation();
        }
    }
}
