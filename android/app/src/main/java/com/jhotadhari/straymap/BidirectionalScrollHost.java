package com.jhotadhari.straymap;

import android.content.Context;
import android.view.MotionEvent;
import android.view.VelocityTracker;
import android.view.View;
import android.view.ViewConfiguration;
import android.view.ViewGroup;
import android.widget.OverScroller;
import android.widget.ScrollView;

import com.facebook.react.views.scroll.ReactHorizontalScrollView;

/**
 * Extends React Native's Fabric-compatible {@link ReactHorizontalScrollView}
 * to enable simultaneous two-dimensional scrolling.
 *
 * It intercepts touches that involve significant movement (beyond the system
 * {@code touchSlop}) and handles both axes: horizontal scrolling itself via
 * the parent {@code HorizontalScrollView}, and vertical scrolling by
 * forwarding deltas to an inner scrollable — typically the
 * {@code ReactScrollView} backing a React Native {@code FlatList}, or the
 * {@code RecyclerView} backing a {@code FlashList}.
 *
 * Stationary taps (no movement beyond touch slop) are NOT intercepted, so
 * child views like {@code TouchableOpacity} receive their {@code onPress}
 * events normally.
 *
 * The inner scrollable is discovered automatically by walking the view tree
 * (preferring {@link ScrollView}, falling back to any vertically-scrollable
 * {@link ViewGroup}).
 * Set {@code scrollEnabled={false}} on the inner list so it does not
 * compete for the gesture stream.
 *
 * <h3>Why we call {@code super} in touch methods</h3>
 * {@code ReactHorizontalScrollView.onInterceptTouchEvent} does essential
 * React Native touch-system setup: when it detects a drag it calls
 * {@code handleInterceptedTouchEvent()} which notifies
 * {@code NativeGestureUtil}, emits {@code onScrollBeginDrag} to JS, and
 * sets the {@code mDragging} flag. {@code onTouchEvent} dispatches the
 * {@code onScrollEndDrag} JS event and manages horizontal fling. Without
 * these {@code super} calls the RN touch pipeline is never initialized
 * for child views, and {@code TouchableOpacity.onPress} silently fails.
 */
public class BidirectionalScrollHost extends ReactHorizontalScrollView {

    // ── Touch tracking ───────────────────────────────────────────────────────
    private VelocityTracker velocityTracker;
    private float lastTouchY;
    private boolean isBeingDragged;

    // ── Fling ────────────────────────────────────────────────────────────────
    private OverScroller scroller;
    private final int mTouchSlop;

    // ── Child vertical scrollable ────────────────────────────────────────────
    private ViewGroup childScrollView;

    // ── Constructors ─────────────────────────────────────────────────────────

    public BidirectionalScrollHost(Context context) {
        super(context);
        mTouchSlop = ViewConfiguration.get(context).getScaledTouchSlop();
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

    /**
     * First delegates to {@code super} so React Native's touch pipeline is
     * properly initialized (NativeGestureUtil, onScrollBeginDrag, etc.).
     * If the parent intercepts (horizontal movement), we're done.
     *
     * If the parent didn't intercept, we additionally check for vertical
     * movement — necessary because the inner list has
     * {@code scrollEnabled={false}}, so the BidirectionalScrollHost must
     * handle all vertical scrolling.
     *
     * Taps (no movement beyond {@code touchSlop}) pass through to children,
     * so {@code TouchableOpacity.onPress} works normally.
     */
    @Override
    public boolean onInterceptTouchEvent(MotionEvent ev) {
        // ── Let ReactHorizontalScrollView handle RN touch integration and
        //    standard horizontal-scroll interception ──────────────────────────
        try {
            if (super.onInterceptTouchEvent(ev)) {
                isBeingDragged = true;
                return true;
            }
        } catch (IllegalArgumentException e) {
            // Standard workaround for Android ScrollView bug.
            // https://tinyurl.com/mw6qkod (Stack Overflow)
        }

        // ── Parent didn't intercept — check for vertical movement ──────────
        switch (ev.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                lastTouchY = ev.getY();
                break;

            case MotionEvent.ACTION_MOVE: {
                if (isBeingDragged) {
                    return true;
                }
                final float dy = Math.abs(ev.getY() - lastTouchY);
                if (dy > mTouchSlop) {
                    isBeingDragged = true;
                    return true;
                }
                break;
            }

            case MotionEvent.ACTION_UP:
            case MotionEvent.ACTION_CANCEL:
                isBeingDragged = false;
                break;
        }
        return false;
    }

    @Override
    public void requestDisallowInterceptTouchEvent(boolean disallowIntercept) {
        // Once a drag has started, the child cannot reclaim the gesture —
        // otherwise scrolling would be interrupted mid-swipe.
        if (disallowIntercept && isBeingDragged) {
            return;
        }
        super.requestDisallowInterceptTouchEvent(disallowIntercept);
    }

    // ── Touch handling ───────────────────────────────────────────────────────

    /**
     * Handles vertical scrolling ourselves (forwarding deltas to the child
     * scrollable) and delegates to {@code super.onTouchEvent} for:
     * <ul>
     *   <li>React Native touch dispatch (essential for JS onPress)</li>
     *   <li>Horizontal scrolling via the parent ScrollView</li>
     *   <li>onScrollBeginDrag / onScrollEndDrag JS events</li>
     *   <li>Horizontal fling setup</li>
     * </ul>
     */
    @Override
    public boolean onTouchEvent(MotionEvent ev) {
        childScrollView = findScrollChild(this);
        if (childScrollView == null) {
            return super.onTouchEvent(ev);
        }

        // Track velocity for vertical fling (horizontal fling is handled by super)
        if (velocityTracker == null) {
            velocityTracker = VelocityTracker.obtain();
        }
        velocityTracker.addMovement(ev);

        switch (ev.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                scroller.abortAnimation();
                lastTouchY = ev.getY();
                break;

            case MotionEvent.ACTION_MOVE: {
                float dy = lastTouchY - ev.getY();
                lastTouchY = ev.getY();

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
                int vy = (int) velocityTracker.getYVelocity();

                int maxY = Math.max(0,
                    (childScrollView.getChildCount() > 0
                        ? childScrollView.getChildAt(0).getHeight() : 0) -
                    childScrollView.getHeight());

                // Only vertical fling — horizontal is handled by super
                scroller.fling(
                    0, childScrollView.getScrollY(),
                    0, -vy,
                    0, 0, 0, maxY,
                    0, 0);

                postInvalidateOnAnimation();
                velocityTracker.recycle();
                velocityTracker = null;
                break;
            }
        }

        // Let ReactHorizontalScrollView handle:
        // - RN touch dispatch (essential for JS onPress to work)
        // - Horizontal scrolling via HorizontalScrollView
        // - Horizontal fling setup
        // - onScrollBeginDrag / onScrollEndDrag JS events
        super.onTouchEvent(ev);

        return true;
    }

    // ── Fling animation ──────────────────────────────────────────────────────

    @Override
    public void computeScroll() {
        // Let super handle horizontal fling
        super.computeScroll();

        // Handle vertical fling ourselves
        if (scroller.computeScrollOffset()) {
            int newY = scroller.getCurrY();
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
