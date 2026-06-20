import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Text,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Svg, Path, Circle } from 'react-native-svg';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/src/theme/ThemeContext';
import { spacing, radii } from '@/src/theme/tokens';
import Animated, { FadeInUp, FadeOutDown, FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { getStroke } from 'perfect-freehand';

export type Tool = 'pen' | 'pencil' | 'marker' | 'brush' | 'eraser' | 'hand';

export type DrawPath = {
  id: string;
  points: { x: number; y: number }[];
  color: string;
  width: number;
  tool: Tool;
};

export interface DrawingCanvasProps {
  visible: boolean;
  initialPaths?: DrawPath[];
  onClose: () => void;
  onSave: (svgString: string, paths: DrawPath[]) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Curated professional color palette
const COLORS = [
  '#000000', '#434343', '#666666', '#999999', '#ffffff',
  '#EF4444', '#F97316', '#EAB308', '#22C55E', '#06B6D4',
  '#3B82F6', '#8B5CF6', '#EC4899', '#14B8A6', '#F59E0B',
  '#DC2626', '#EA580C', '#D97706', '#16A34A', '#0891B2',
  '#2563EB', '#7C3AED', '#DB2777', '#0D9488', '#B45309',
  '#7F1D1D', '#78350F', '#14532D', '#164E63', '#1E3A8A',
  '#4C1D95', '#831843', '#134E4A', '#92400E', '#1F2937',
];

// Tool definitions
const TOOLS: { id: Tool; icon: string; label: string; family: 'MaterialCommunityIcons' | 'Ionicons' }[] = [
  { id: 'pen',    icon: 'draw-pen',       label: 'Pen',    family: 'MaterialCommunityIcons' },
  { id: 'pencil', icon: 'lead-pencil',    label: 'Pencil', family: 'MaterialCommunityIcons' },
  { id: 'marker', icon: 'marker',         label: 'Marker', family: 'MaterialCommunityIcons' },
  { id: 'brush',  icon: 'brush',          label: 'Brush',  family: 'MaterialCommunityIcons' },
  { id: 'eraser', icon: 'eraser',         label: 'Eraser', family: 'MaterialCommunityIcons' },
];

// Width presets per tool
const WIDTHS = [2, 4, 7, 12, 20];

function getStrokeOptions(tool: Tool, width: number) {
  switch (tool) {
    case 'pen':
      return { size: width, thinning: 0.6, smoothing: 0.5, streamline: 0.5 };
    case 'pencil':
      return { size: width, thinning: 0.3, smoothing: 0.7, streamline: 0.3 };
    case 'marker':
      return { size: width * 2.5, thinning: 0.0, smoothing: 0.5, streamline: 0.5 };
    case 'brush':
      return { size: width * 1.8, thinning: 0.8, smoothing: 0.3, streamline: 0.3 };
    default:
      return { size: width, thinning: 0.5, smoothing: 0.5, streamline: 0.5 };
  }
}

function getToolOpacity(tool: Tool): number {
  if (tool === 'marker') return 0.5;
  if (tool === 'pencil') return 0.75;
  return 1;
}

function createPathData(points: { x: number; y: number }[], tool: Tool, width: number): string {
  if (points.length === 0) return '';
  const opts = getStrokeOptions(tool, width);
  const stroke = getStroke(points.map((p) => [p.x, p.y]), opts);
  if (!stroke.length) return '';
  const d = stroke.reduce(
    (acc, [x0, y0], i, arr) => {
      const [x1, y1] = arr[(i + 1) % arr.length];
      acc.push(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2);
      return acc;
    },
    ['M', ...stroke[0], 'Q'] as (string | number)[]
  );
  d.push('Z');
  return d.join(' ');
}

export function DrawingCanvas({ visible, initialPaths, onClose, onSave }: DrawingCanvasProps) {
  const { colors, isDark } = useTheme();

  const [paths, setPaths] = useState<DrawPath[]>(initialPaths || []);
  const [currentPath, setCurrentPath] = useState<DrawPath | null>(null);
  const [activeTool, setActiveTool] = useState<Tool>('pen');
  const [penColor, setPenColor] = useState('#EF4444');
  const [penWidth, setPenWidth] = useState(4);

  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showWidthPicker, setShowWidthPicker] = useState(false);

  if (!visible) return null;

  // ─── Erase helper ────────────────────────────────────────────────
  const erasePaths = (ex: number, ey: number) => {
    const r = (penWidth + 10) * 2;
    setPaths((prev) =>
      prev.filter((path) => !path.points.some((p) => Math.hypot(p.x - ex, p.y - ey) < r))
    );
  };

  // ─── Gesture ─────────────────────────────────────────────────────
  const pan = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .minDistance(0)
    .enabled(!showColorPicker && !showWidthPicker && activeTool !== 'hand')
    .runOnJS(true)
    .onStart((e) => {
      if (activeTool === 'eraser') {
        erasePaths(e.x, e.y);
      } else {
        setCurrentPath({
          id: Date.now().toString(),
          points: [{ x: e.x, y: e.y }],
          color: penColor,
          width: penWidth,
          tool: activeTool,
        });
      }
    })
    .onChange((e) => {
      if (activeTool === 'eraser') {
        erasePaths(e.x, e.y);
      } else {
        setCurrentPath((prev) => {
          if (!prev) return prev;
          return { ...prev, points: [...prev.points, { x: e.x, y: e.y }] };
        });
      }
    })
    .onEnd(() => {
      if (activeTool !== 'eraser') {
        setCurrentPath((prev) => {
          if (prev) setPaths((old) => [...old, prev]);
          return null;
        });
      }
    });

  // ─── Generate SVG ─────────────────────────────────────────────────
  const generateSVG = () => {
    const allPaths = currentPath ? [...paths, currentPath] : [...paths];
    if (allPaths.length === 0) { onSave('', []); return; }

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    allPaths.forEach((path) => {
      path.points.forEach((p) => {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
      });
    });

    const pad = 20;
    // ensure min bounds don't go negative, but max bounds can expand infinitely
    minX = minX === Infinity ? 0 : Math.max(0, minX - pad); 
    minY = minY === Infinity ? 0 : Math.max(0, minY - pad);
    maxX = maxX === -Infinity ? SCREEN_WIDTH : maxX + pad; 
    maxY = maxY === -Infinity ? SCREEN_HEIGHT : maxY + pad;
    const w = maxX - minX, h = maxY - minY;

    let svgData = `<svg viewBox="${minX} ${minY} ${w} ${h}" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg">`;
    allPaths.forEach((path) => {
      const d = createPathData(path.points, path.tool, path.width);
      const opacity = getToolOpacity(path.tool);
      svgData += `<path d="${d}" fill="${path.color}" opacity="${opacity}" />`;
    });
    svgData += `</svg>`;
    onSave(svgData, allPaths);
  };

  // ─── Stroke preview helper ────────────────────────────────────────
  const StrokePreview = ({ width, selected }: { width: number; selected: boolean }) => {
    const strokeColor = selected ? colors.accent : colors.textSecondary;
    const pts = Array.from({ length: 8 }, (_, i) => ({ x: 10 + i * 12, y: 16 + Math.sin(i) * 4 }));
    const d = createPathData(pts, activeTool === 'eraser' ? 'pen' : activeTool, width);
    return (
      <TouchableOpacity
        onPress={() => { setPenWidth(width); }}
        style={[styles.widthBtn, selected && { backgroundColor: colors.accent + '22' }]}
      >
        <Svg width={100} height={32}>
          <Path d={d} fill={strokeColor} opacity={0.9} />
        </Svg>
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View
      entering={SlideInDown}
      exiting={SlideOutDown}
      style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? '#0a0a0a' : '#f5f5f5', zIndex: 999 }]}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>

          {/* ── Header ── */}
          <View style={[styles.header, { borderBottomColor: colors.glassBorder }]}>
            <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
              <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Drawing</Text>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setPaths((p) => p.slice(0, -1))}
                style={[styles.iconBtn, { opacity: paths.length > 0 ? 1 : 0.3 }]}
                disabled={paths.length === 0}
              >
                <Ionicons name="arrow-undo" size={22} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setPaths([])} style={styles.iconBtn}>
                <Ionicons name="trash-outline" size={22} color={colors.error} />
              </TouchableOpacity>
              <TouchableOpacity onPress={generateSVG} style={[styles.saveBtn, { backgroundColor: colors.accent }]}>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Canvas ── */}
          <ScrollView 
            style={styles.canvas} 
            scrollEnabled={true}
            showsVerticalScrollIndicator={true}
          >
            <GestureDetector gesture={pan}>
              <View style={{ height: SCREEN_HEIGHT * 3, width: '100%' }}>
                <Svg style={StyleSheet.absoluteFill}>
                  {paths.map((path) => (
                    <Path
                      key={path.id}
                      d={createPathData(path.points, path.tool, path.width)}
                      fill={path.color}
                      opacity={getToolOpacity(path.tool)}
                    />
                  ))}
                  {currentPath && (
                    <Path
                      d={createPathData(currentPath.points, currentPath.tool, currentPath.width)}
                      fill={currentPath.color}
                      opacity={getToolOpacity(currentPath.tool)}
                    />
                  )}
                </Svg>
              </View>
            </GestureDetector>
          </ScrollView>

          {/* ── Width picker popup ── */}
          {showWidthPicker && (
            <Animated.View
              entering={FadeInUp}
              exiting={FadeOutDown}
              style={[styles.widthPopup, {
                backgroundColor: isDark ? 'rgba(30,30,30,0.98)' : 'rgba(255,255,255,0.98)',
                borderColor: colors.glassBorder,
              }]}
            >
              <Text style={[styles.popupTitle, { color: colors.textSecondary }]}>Stroke Size</Text>
              {WIDTHS.map((w) => (
                <StrokePreview key={w} width={w} selected={penWidth === w} />
              ))}
            </Animated.View>
          )}

          {/* ── Bottom toolbar ── */}
          <View style={[styles.toolbar, { backgroundColor: isDark ? 'rgba(20,20,20,0.97)' : 'rgba(245,245,245,0.97)', borderTopColor: colors.glassBorder }]}>

            {/* Color swatch */}
            <TouchableOpacity
              onPress={() => { setShowColorPicker(true); setShowWidthPicker(false); }}
              style={styles.colorBtn}
            >
              <View style={[styles.colorRing, { borderColor: colors.textPrimary }]}>
                <View style={[styles.colorFill, { backgroundColor: penColor }]} />
              </View>
            </TouchableOpacity>

            {/* Stroke width */}
            <TouchableOpacity
              onPress={() => { setShowWidthPicker((v) => !v); setShowColorPicker(false); }}
              style={[styles.toolIconBtn, showWidthPicker && { backgroundColor: colors.accent + '22' }]}
            >
              <View style={{ alignItems: 'center', gap: 2 }}>
                <View style={{ width: 18, height: 2, borderRadius: 1, backgroundColor: colors.textPrimary }} />
                <View style={{ width: 18, height: 4, borderRadius: 2, backgroundColor: colors.textPrimary }} />
                <View style={{ width: 18, height: 7, borderRadius: 3, backgroundColor: colors.textPrimary }} />
              </View>
            </TouchableOpacity>

            {/* Divider */}
            <View style={[styles.divider, { backgroundColor: colors.glassBorder }]} />

            {/* Tool buttons */}
            {TOOLS.map((t) => (
              <TouchableOpacity
                key={t.id}
                onPress={() => { setActiveTool(t.id); setShowWidthPicker(false); setShowColorPicker(false); }}
                style={[
                  styles.toolIconBtn,
                  activeTool === t.id && { backgroundColor: colors.accent + '22' },
                ]}
              >
                {t.family === 'MaterialCommunityIcons' ? (
                  <MaterialCommunityIcons
                    name={t.icon as any}
                    size={22}
                    color={activeTool === t.id ? colors.accent : colors.textSecondary}
                  />
                ) : (
                  <Ionicons
                    name={t.icon as any}
                    size={22}
                    color={activeTool === t.id ? colors.accent : colors.textSecondary}
                  />
                )}
                {activeTool === t.id && (
                  <View style={[styles.toolDot, { backgroundColor: colors.accent }]} />
                )}
              </TouchableOpacity>
            ))}
          </View>

          {/* ── Color picker sheet ── */}
          {showColorPicker && (
            <Animated.View entering={FadeIn} exiting={FadeOut} style={[StyleSheet.absoluteFill, { justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' }]}>
              <TouchableOpacity style={StyleSheet.absoluteFill} onPress={() => setShowColorPicker(false)} />
              <View style={[styles.colorSheet, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]}>
                <View style={[styles.bsHandle, { backgroundColor: colors.border }]} />

                {/* Selected preview */}
                <View style={styles.colorPreviewRow}>
                  <View style={[styles.colorPreviewCircle, { backgroundColor: penColor, borderColor: colors.border }]} />
                  <Text style={[styles.colorHex, { color: colors.textSecondary }]}>{penColor.toUpperCase()}</Text>
                </View>

                {/* Color grid */}
                <View style={styles.colorGrid}>
                  {COLORS.map((c) => (
                    <TouchableOpacity
                      key={c}
                      onPress={() => setPenColor(c)}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: c, borderColor: penColor === c ? colors.accent : 'rgba(128,128,128,0.3)' },
                        penColor === c && styles.colorSwatchSelected,
                      ]}
                    />
                  ))}
                </View>

                <TouchableOpacity
                  onPress={() => setShowColorPicker(false)}
                  style={[styles.doneBtn, { backgroundColor: colors.accent }]}
                >
                  <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

        </SafeAreaView>
      </GestureHandlerRootView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  iconBtn: {
    padding: 8,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  canvas: {
    flex: 1,
  },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    paddingBottom: 20,
    gap: 4,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  colorBtn: {
    padding: 6,
  },
  colorRing: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorFill: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  toolIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toolDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 28,
    marginHorizontal: 4,
  },
  // Width popup
  widthPopup: {
    position: 'absolute',
    bottom: 90,
    left: 60,
    right: 20,
    borderRadius: 16,
    borderWidth: 1,
    padding: spacing.md,
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 12,
  },
  popupTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  widthBtn: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  // Color sheet
  colorSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: spacing.xl,
    paddingBottom: 40,
  },
  bsHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  colorPreviewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: spacing.lg,
  },
  colorPreviewCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 2,
  },
  colorHex: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'monospace',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: spacing.xl,
  },
  colorSwatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
  },
  colorSwatchSelected: {
    borderWidth: 3,
    transform: [{ scale: 1.2 }],
  },
  doneBtn: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
});
