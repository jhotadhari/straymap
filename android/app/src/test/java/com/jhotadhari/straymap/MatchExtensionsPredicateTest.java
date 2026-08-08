package com.jhotadhari.straymap;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.junit.runners.JUnit4;

import java.io.File;

import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

@RunWith(JUnit4.class)
public class MatchExtensionsPredicateTest {

    @Test
    public void constructor_addsLeadingDot_whenMissing() {
        String[] exts = {"jpg", ".png"};
        MatchExtensionsPredicate pred = new MatchExtensionsPredicate(exts);
        pred.sdkAtLeastO = true;
        assertTrue(pred.test(new File("photo.jpg").toPath()));
        assertTrue(pred.test(new File("image.png").toPath()));
        assertFalse(pred.test(new File("photo.gif").toPath()));
    }

    @Test
    public void constructor_lowercasesExtensions() {
        String[] exts = {"JPG", ".PNG"};
        MatchExtensionsPredicate pred = new MatchExtensionsPredicate(exts);
        pred.sdkAtLeastO = true;
        assertTrue(pred.test(new File("photo.jpg").toPath()));
        assertTrue(pred.test(new File("image.png").toPath()));
    }

    @Test
    public void constructor_handlesMixedCaseAndMissingDots() {
        String[] exts = {"JPG", ".Png", "tif"};
        MatchExtensionsPredicate pred = new MatchExtensionsPredicate(exts);
        pred.sdkAtLeastO = true;
        assertTrue(pred.test(new File("photo.jpg").toPath()));
        assertTrue(pred.test(new File("image.png").toPath()));
        assertTrue(pred.test(new File("scan.tif").toPath()));
        assertFalse(pred.test(new File("doc.gif").toPath()));
    }

    @Test
    public void constructor_handlesEmptyArray() {
        String[] exts = new String[0];
        MatchExtensionsPredicate pred = new MatchExtensionsPredicate(exts);
        assertFalse(pred.test(new File("photo.jpg").toPath()));
    }

    @Test
    public void test_nullPath_returnsFalse() {
        MatchExtensionsPredicate pred = new MatchExtensionsPredicate(new String[]{"jpg"});
        assertFalse(pred.test(null));
    }

    @Test
    public void test_matchingExtension_returnsTrue() {
        MatchExtensionsPredicate pred = new MatchExtensionsPredicate(new String[]{"jpg"});
        pred.sdkAtLeastO = true;
        assertTrue(pred.test(new File("photo.jpg").toPath()));
    }

    @Test
    public void test_nonMatchingExtension_returnsFalse() {
        MatchExtensionsPredicate pred = new MatchExtensionsPredicate(new String[]{"png"});
        assertFalse(pred.test(new File("photo.jpg").toPath()));
    }

    @Test
    public void test_caseInsensitiveMatch() {
        MatchExtensionsPredicate pred = new MatchExtensionsPredicate(new String[]{"jpg"});
        pred.sdkAtLeastO = true;
        assertTrue(pred.test(new File("photo.JPG").toPath()));
    }

    @Test
    public void test_filenameEndsWithButDoesNotMatch() {
        MatchExtensionsPredicate pred = new MatchExtensionsPredicate(new String[]{"jpg"});
        assertFalse(pred.test(new File("photo.jpg.bak").toPath()));
    }

    @Test
    public void test_multipleExtensions_matchesAny() {
        MatchExtensionsPredicate pred = new MatchExtensionsPredicate(new String[]{"png", "gif", "jpg"});
        pred.sdkAtLeastO = true;
        assertTrue(pred.test(new File("photo.jpg").toPath()));
        assertTrue(pred.test(new File("image.png").toPath()));
        assertTrue(pred.test(new File("anim.gif").toPath()));
        assertFalse(pred.test(new File("doc.bmp").toPath()));
    }

    @Test
    public void test_emptyStringExtension() {
        MatchExtensionsPredicate pred = new MatchExtensionsPredicate(new String[]{""});
        assertFalse(pred.test(new File("photo").toPath()));
    }

    @Test
    public void test_dottedFilename_matchesExtension() {
        MatchExtensionsPredicate pred = new MatchExtensionsPredicate(new String[]{"hidden"});
        pred.sdkAtLeastO = true;
        assertTrue(pred.test(new File(".hidden").toPath()));
    }

    @Test
    public void test_multipleDots_matchesLastExt() {
        MatchExtensionsPredicate pred = new MatchExtensionsPredicate(new String[]{"txt"});
        pred.sdkAtLeastO = true;
        assertTrue(pred.test(new File("file.with.dots.txt").toPath()));
    }

    @Test
    public void test_sdkBelowO_returnsFalse() {
        String[] exts = {"jpg"};
        MatchExtensionsPredicate pred = new MatchExtensionsPredicate(exts) {
            @Override
            protected boolean isAtLeastO() {
                return false;
            }
        };
        assertFalse(pred.test(new File("photo.jpg").toPath()));
    }
}
