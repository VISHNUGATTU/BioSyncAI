import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Share,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Activity,
  Utensils,
  FileText,
  Calendar,
  Clock,
  ChevronRight,
  ArrowLeft,
  Filter,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  RotateCcw,
  AlertTriangle,
  Layers,
  Share2,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import userApi from '../api/userApi';
import { getReportViewUrl } from '../api/axios';
import GlassCard from '../components/GlassCard';
import DataProvenanceBadge from '../components/DataProvenanceBadge';
import ReportViewerModal from '../components/ReportViewerModal';

const CATEGORY_FILTERS = [
  { key: 'all', label: 'All Records' },
  { key: 'vitals', label: 'Vitals & Biomarkers' },
  { key: 'laboratory', label: 'Lab Reports' },
  { key: 'nutrition', label: 'Nutrition & Meals' },
  { key: 'clinical_visit', label: 'Doorstep Visits' },
];

const PROVENANCE_FILTERS = [
  { key: 'all', label: 'All Sources' },
  { key: 'actual', label: 'Clinical Actuals' },
  { key: 'ai', label: 'AI Projections' },
];

export const HealthTimelineScreen = ({ navigation, embedded = false }) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark, shadows } = useTheme();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timelineEvents, setTimelineEvents] = useState([]);
  const [summary, setSummary] = useState(null);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedProvenance, setSelectedProvenance] = useState('all');

  const [selectedReportAppt, setSelectedReportAppt] = useState(null);

  // Fetch timeline from backend endpoint
  const fetchTimeline = useCallback(async () => {
    try {
      const params = {};
      if (selectedCategory !== 'all') params.category = selectedCategory;
      if (selectedProvenance !== 'all') params.provenanceType = selectedProvenance;

      const res = await userApi.getHealthTimeline(params);
      if (res.success) {
        setTimelineEvents(res.timeline || []);
        if (res.summary) setSummary(res.summary);
      } else {
        setTimelineEvents([]);
      }
    } catch (err) {
      console.warn('[HealthTimeline] Fetch error:', err.message);
      setTimelineEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedCategory, selectedProvenance]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTimeline();
  }, [fetchTimeline]);

  // Date formatters
  const formatEventDate = (timestamp) => {
    if (!timestamp) return 'Recent';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return 'Recent';

    const today = new Date();
    const isToday =
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear();

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isYesterday =
      d.getDate() === yesterday.getDate() &&
      d.getMonth() === yesterday.getMonth() &&
      d.getFullYear() === yesterday.getFullYear();

    if (isToday) return 'Today';
    if (isYesterday) return 'Yesterday';

    return d.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatEventTime = (timestamp) => {
    if (!timestamp) return '';
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleQuickShareReport = async (event) => {
    try {
      const testTitle = event.data?.testName || 'Diagnostic Lab Specimen';
      const barcode = event.data?.barcode || 'BIO-SAMPLE';
      const verifiedBy = event.data?.verifiedBy || 'Dr. Arvind Sharma, MD';
      const apptId = event.originalId || 'demo';
      const shareUrl = event.data?.resultPdfUrl || getReportViewUrl(apptId);

      const shareMessage = `🏥 BIOSYNC AI — OFFICIAL DIAGNOSTIC REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Diagnostic Panel: ${testTitle}
NABL Accreditation: ISO 15189:2022 Certified
Specimen Barcode: #${barcode}
Verification: Verified & Digitally Signed by ${verifiedBy}

🔗 Access Certified Diagnostic Web Report / PDF:
${shareUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sec. 1 & 47 Notice: This report represents certified wet-lab medical measurements issued by BioSync Diagnostics Central Lab.`;

      await Share.share(
        Platform.OS === 'ios'
          ? { message: shareMessage, url: shareUrl }
          : { title: `BioSync Lab Report - ${testTitle}`, message: shareMessage },
        { dialogTitle: `Share Lab Report: ${testTitle}` }
      );
    } catch (err) {
      console.warn('[Timeline] Share error:', err.message);
    }
  };

  // Group events by date label
  const groupedEvents = useMemo(() => {
    const groups = {};
    timelineEvents.forEach((ev) => {
      const dateLabel = formatEventDate(ev.timestamp);
      if (!groups[dateLabel]) {
        groups[dateLabel] = [];
      }
      groups[dateLabel].push(ev);
    });
    return groups;
  }, [timelineEvents]);

  // Render Event Icon & Color
  const getEventVisuals = (event) => {
    switch (event.category) {
      case 'vitals':
        return {
          icon: Activity,
          iconColor: event.criticalAlert ? colors.roseLight || '#f43f5e' : colors.cyanLight || '#06b6d4',
          bgGlow: event.criticalAlert ? 'rgba(244, 63, 94, 0.15)' : 'rgba(6, 182, 212, 0.12)',
          borderColor: event.criticalAlert ? 'rgba(244, 63, 94, 0.35)' : 'rgba(6, 182, 212, 0.25)',
        };
      case 'nutrition':
        return {
          icon: Utensils,
          iconColor: '#a855f7',
          bgGlow: 'rgba(168, 85, 247, 0.12)',
          borderColor: 'rgba(168, 85, 247, 0.25)',
        };
      case 'laboratory':
        return {
          icon: FileText,
          iconColor: '#10b981',
          bgGlow: 'rgba(16, 185, 129, 0.12)',
          borderColor: 'rgba(16, 185, 129, 0.3)',
        };
      case 'clinical_visit':
      default:
        return {
          icon: Calendar,
          iconColor: colors.primary,
          bgGlow: isDark ? 'rgba(6, 182, 212, 0.15)' : 'rgba(8, 145, 178, 0.1)',
          borderColor: colors.borderCyan,
        };
    }
  };

  return (
    <View
      style={[
        styles.screenContainer,
        {
          backgroundColor: colors.bgDark,
          paddingTop: embedded ? 0 : insets.top,
        },
      ]}
    >
      {/* Top Header (only if not embedded) */}
      {!embedded && (
        <View
          style={[
            styles.topHeader,
            {
              backgroundColor: colors.bgSurface,
              borderBottomColor: colors.borderSubtle,
            },
          ]}
        >
          <View style={styles.headerLeft}>
            {navigation?.canGoBack() && (
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={[styles.backBtn, { borderColor: colors.borderSubtle }]}
                activeOpacity={0.7}
              >
                <ArrowLeft size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            )}
            <View>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
                Health Timeline
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
                Longitudinal Clinical Audit Trail
              </Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={onRefresh}
            style={[styles.refreshIconBtn, { backgroundColor: colors.borderCyan }]}
            activeOpacity={0.7}
          >
            <RotateCcw size={16} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        {/* ========================================== */}
        {/* 1. LONGITUDINAL SUMMARY HERO CARD          */}
        {/* Blueprint Section 45 & 47 Provenance Audit */}
        {/* ========================================== */}
        {summary && (
          <GlassCard
            style={[
              styles.summaryHeroCard,
              {
                borderColor: colors.borderCyan || 'rgba(6, 182, 212, 0.3)',
                backgroundColor: isDark
                  ? 'rgba(6, 182, 212, 0.05)'
                  : 'rgba(8, 145, 178, 0.03)',
              },
            ]}
          >
            <View style={styles.summaryTopRow}>
              <View style={styles.summaryTitleWrap}>
                <Layers size={18} color={colors.primary} />
                <Text style={[styles.summaryTitle, { color: colors.textPrimary }]}>
                  Longitudinal Health Records
                </Text>
              </View>
              <View
                style={[
                  styles.totalCountPill,
                  { backgroundColor: colors.borderCyan },
                ]}
              >
                <Text style={[styles.totalCountText, { color: colors.primary }]}>
                  {summary.totalEvents} Entries
                </Text>
              </View>
            </View>

            <Text style={[styles.summaryDesc, { color: colors.textSecondary }]}>
              Unified chronological timeline across verified wet-lab diagnostics, doorstep intake vitals, and AI-predicted nutritional spikes.
            </Text>

            {/* Split Metrics: Actuals vs AI Estimates */}
            <View style={styles.provenanceMetricsRow}>
              <View
                style={[
                  styles.metricBox,
                  {
                    backgroundColor: isDark
                      ? 'rgba(16, 185, 129, 0.1)'
                      : 'rgba(16, 185, 129, 0.08)',
                    borderColor: 'rgba(16, 185, 129, 0.3)',
                  },
                ]}
              >
                <View style={styles.metricHeader}>
                  <ShieldCheck size={14} color="#10b981" />
                  <Text style={[styles.metricLabel, { color: '#10b981' }]}>
                    VERIFIED CLINICAL ACTUALS
                  </Text>
                </View>
                <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                  {summary.verifiedMeasurementsCount}
                </Text>
                <Text style={[styles.metricSub, { color: colors.textMuted }]}>
                  NABL Labs & Staff Measurements
                </Text>
              </View>

              <View
                style={[
                  styles.metricBox,
                  {
                    backgroundColor: isDark
                      ? 'rgba(168, 85, 247, 0.1)'
                      : 'rgba(168, 85, 247, 0.08)',
                    borderColor: 'rgba(168, 85, 247, 0.3)',
                  },
                ]}
              >
                <View style={styles.metricHeader}>
                  <Sparkles size={14} color="#a855f7" />
                  <Text style={[styles.metricLabel, { color: '#a855f7' }]}>
                    AI ESTIMATES & PROJECTIONS
                  </Text>
                </View>
                <Text style={[styles.metricValue, { color: colors.textPrimary }]}>
                  {summary.aiEstimatesCount}
                </Text>
                <Text style={[styles.metricSub, { color: colors.textMuted }]}>
                  Sec. 1 & 47 Disclaimed Projections
                </Text>
              </View>
            </View>
          </GlassCard>
        )}

        {/* ========================================== */}
        {/* 2. FILTER PILLS (CATEGORY & PROVENANCE)    */}
        {/* ========================================== */}
        <View style={styles.filtersSection}>
          {/* Category Filter Horizontal Scroll */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterScroll}
          >
            {CATEGORY_FILTERS.map((cat) => {
              const active = selectedCategory === cat.key;
              return (
                <TouchableOpacity
                  key={cat.key}
                  style={[
                    styles.filterPill,
                    {
                      backgroundColor: active
                        ? colors.primary
                        : isDark
                        ? 'rgba(255, 255, 255, 0.05)'
                        : '#ffffff',
                      borderColor: active ? colors.primary : colors.borderSubtle,
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat.key)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      {
                        color: active
                          ? '#000000'
                          : colors.textSecondary,
                        fontWeight: active ? '700' : '600',
                      },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Provenance Filter Pills */}
          <View style={styles.provenancePillRow}>
            {PROVENANCE_FILTERS.map((prov) => {
              const active = selectedProvenance === prov.key;
              return (
                <TouchableOpacity
                  key={prov.key}
                  style={[
                    styles.provenanceSubPill,
                    {
                      backgroundColor: active
                        ? isDark
                          ? 'rgba(6, 182, 212, 0.2)'
                          : 'rgba(8, 145, 178, 0.12)'
                        : 'transparent',
                      borderColor: active
                        ? colors.borderCyanStrong || colors.primary
                        : colors.borderSubtle,
                    },
                  ]}
                  onPress={() => setSelectedProvenance(prov.key)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.provenanceSubPillText,
                      {
                        color: active ? colors.primary : colors.textMuted,
                        fontWeight: active ? '700' : '500',
                      },
                    ]}
                  >
                    {prov.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ========================================== */}
        {/* 3. VERTICAL TIMELINE FEED                  */}
        {/* ========================================== */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>
              Compiling longitudinal health audit trail...
            </Text>
          </View>
        ) : Object.keys(groupedEvents).length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <View style={[styles.emptyIconBox, { backgroundColor: colors.borderCyan }]}>
              <Filter size={24} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No Records Match Current Filters
            </Text>
            <Text style={[styles.emptySub, { color: colors.textMuted }]}>
              Try selecting 'All Records' or 'All Sources' to view your complete clinical timeline.
            </Text>
            <TouchableOpacity
              style={[styles.clearFilterBtn, { backgroundColor: colors.primary }]}
              onPress={() => {
                setSelectedCategory('all');
                setSelectedProvenance('all');
              }}
              activeOpacity={0.8}
            >
              <RotateCcw size={14} color="#000" />
              <Text style={styles.clearFilterBtnText}>Reset All Filters</Text>
            </TouchableOpacity>
          </GlassCard>
        ) : (
          <View style={styles.timelineContainer}>
            {Object.entries(groupedEvents).map(([dateLabel, events]) => (
              <View key={dateLabel} style={styles.dateGroup}>
                {/* Date Header Badge */}
                <View style={styles.dateHeaderRow}>
                  <View
                    style={[
                      styles.dateBadge,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.06)'
                          : 'rgba(0, 0, 0, 0.05)',
                        borderColor: colors.borderSubtle,
                      },
                    ]}
                  >
                    <Calendar size={12} color={colors.textSecondary} />
                    <Text style={[styles.dateBadgeText, { color: colors.textPrimary }]}>
                      {dateLabel}
                    </Text>
                  </View>
                  <View
                    style={[styles.dateDivider, { backgroundColor: colors.borderSubtle }]}
                  />
                </View>

                {/* Events in this Date Group */}
                {events.map((event, idx) => {
                  const visuals = getEventVisuals(event);
                  const IconComp = visuals.icon;
                  const isLastInGroup = idx === events.length - 1;

                  return (
                    <View key={event.id} style={styles.timelineItemRow}>
                      {/* Spine & Node Column */}
                      <View style={styles.spineColumn}>
                        <View
                          style={[
                            styles.timelineNode,
                            {
                              backgroundColor: visuals.bgGlow,
                              borderColor: visuals.borderColor,
                            },
                          ]}
                        >
                          <IconComp size={14} color={visuals.iconColor} />
                        </View>
                        {!isLastInGroup && (
                          <View
                            style={[
                              styles.verticalSpine,
                              { backgroundColor: colors.borderSubtle },
                            ]}
                          />
                        )}
                      </View>

                      {/* Event Content Card */}
                      <View style={styles.eventCardWrap}>
                        <GlassCard
                          style={[
                            styles.eventCard,
                            {
                              borderColor: event.criticalAlert
                                ? 'rgba(244, 63, 94, 0.4)'
                                : colors.borderSubtle,
                              backgroundColor: event.criticalAlert
                                ? isDark
                                  ? 'rgba(244, 63, 94, 0.08)'
                                  : '#fff1f2'
                                : undefined,
                            },
                          ]}
                        >
                          {/* Event Card Header */}
                          <View style={styles.eventHeaderRow}>
                            <View style={{ flex: 1 }}>
                              <Text
                                style={[styles.eventTitle, { color: colors.textPrimary }]}
                                numberOfLines={2}
                              >
                                {event.title}
                              </Text>
                              <View style={styles.eventTimeRow}>
                                <Clock size={11} color={colors.textMuted} />
                                <Text
                                  style={[
                                    styles.eventTimeText,
                                    { color: colors.textMuted },
                                  ]}
                                >
                                  {formatEventTime(event.timestamp)}
                                </Text>
                              </View>
                            </View>

                            {/* Provenance Badge */}
                            <DataProvenanceBadge
                              type={event.provenance}
                              size="xs"
                              showLabel={true}
                            />
                          </View>

                          {/* Event Subtitle / Description */}
                          {event.subtitle ? (
                            <Text
                              style={[
                                styles.eventSubtitle,
                                { color: colors.textSecondary },
                              ]}
                            >
                              {event.subtitle}
                            </Text>
                          ) : null}

                          {/* Specific Category Data Rendering */}
                          {/* VITALS CHIPS */}
                          {event.category === 'vitals' && event.data && (
                            <View style={styles.vitalsChipsGrid}>
                              {event.data.systolic && event.data.diastolic ? (
                                <View
                                  style={[
                                    styles.vitalMetricChip,
                                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc' },
                                  ]}
                                >
                                  <Text style={[styles.vitalChipLabel, { color: colors.textMuted }]}>
                                    BP
                                  </Text>
                                  <Text style={[styles.vitalChipVal, { color: colors.textPrimary }]}>
                                    {event.data.systolic}/{event.data.diastolic}
                                  </Text>
                                </View>
                              ) : null}

                              {event.data.restingHeartRate ? (
                                <View
                                  style={[
                                    styles.vitalMetricChip,
                                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc' },
                                  ]}
                                >
                                  <Text style={[styles.vitalChipLabel, { color: colors.textMuted }]}>
                                    PULSE
                                  </Text>
                                  <Text style={[styles.vitalChipVal, { color: colors.textPrimary }]}>
                                    {event.data.restingHeartRate} bpm
                                  </Text>
                                </View>
                              ) : null}

                              {event.data.oxygenSaturationSpO2 ? (
                                <View
                                  style={[
                                    styles.vitalMetricChip,
                                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc' },
                                  ]}
                                >
                                  <Text style={[styles.vitalChipLabel, { color: colors.textMuted }]}>
                                    SPO2
                                  </Text>
                                  <Text style={[styles.vitalChipVal, { color: colors.textPrimary }]}>
                                    {event.data.oxygenSaturationSpO2}%
                                  </Text>
                                </View>
                              ) : null}

                              {event.data.glucoseFasting ? (
                                <View
                                  style={[
                                    styles.vitalMetricChip,
                                    { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : '#f8fafc' },
                                  ]}
                                >
                                  <Text style={[styles.vitalChipLabel, { color: colors.textMuted }]}>
                                    GLUCOSE
                                  </Text>
                                  <Text style={[styles.vitalChipVal, { color: colors.textPrimary }]}>
                                    {event.data.glucoseFasting} mg/dL
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                          )}

                          {/* NUTRITION CHIPS */}
                          {event.category === 'nutrition' && event.data && (
                            <View style={styles.nutritionChipsRow}>
                              {event.data.calories ? (
                                <View style={styles.nutritionPill}>
                                  <Text style={[styles.nutritionPillText, { color: colors.textPrimary }]}>
                                    {event.data.calories} kcal
                                  </Text>
                                </View>
                              ) : null}
                              {event.data.carbohydrates ? (
                                <View style={styles.nutritionPill}>
                                  <Text style={[styles.nutritionPillText, { color: colors.textPrimary }]}>
                                    {event.data.carbohydrates}g Carbs
                                  </Text>
                                </View>
                              ) : null}
                              {event.data.predictedGlucoseSpike ? (
                                <View
                                  style={[
                                    styles.nutritionPill,
                                    { backgroundColor: 'rgba(245, 158, 11, 0.12)' },
                                  ]}
                                >
                                  <Text style={[styles.nutritionPillText, { color: '#f59e0b' }]}>
                                    Est. +{event.data.predictedGlucoseSpike} mg/dL
                                  </Text>
                                </View>
                              ) : null}
                            </View>
                          )}

                          {/* Critical Alert Warning */}
                          {event.criticalAlert ? (
                            <View style={styles.criticalNoticeBox}>
                              <AlertTriangle size={14} color="#f43f5e" />
                              <Text style={styles.criticalNoticeText}>
                                {typeof event.criticalAlert === 'string'
                                  ? event.criticalAlert
                                  : event.criticalAlert.message || 'Biomarker out of standard physiological range'}
                              </Text>
                            </View>
                          ) : null}

                          {/* AI Disclaimer Section */}
                          {event.isAiGenerated && (
                            <View style={styles.disclaimerRow}>
                              <AlertCircle size={11} color="#a855f7" />
                              <Text style={[styles.disclaimerText, { color: colors.textMuted }]}>
                                {event.disclaimer || 'AI-generated estimate, not a medical diagnosis.'}
                              </Text>
                            </View>
                          )}

                          {/* LAB REPORT ACTION: View Report & Quick Share */}
                          {event.category === 'laboratory' && (
                            <View style={styles.labCardActionsRow}>
                              <TouchableOpacity
                                style={[
                                  styles.viewReportActionBtn,
                                  {
                                    flex: 1,
                                    borderColor: 'rgba(16, 185, 129, 0.35)',
                                    backgroundColor: isDark
                                      ? 'rgba(16, 185, 129, 0.1)'
                                      : 'rgba(16, 185, 129, 0.08)',
                                  },
                                ]}
                                onPress={() => {
                                  // Construct report payload for modal
                                  setSelectedReportAppt({
                                    testCatalog: {
                                      testName: event.data?.testName,
                                      category: event.data?.category,
                                    },
                                    sample: {
                                      barcode: event.data?.barcode,
                                      status: event.data?.status,
                                      resultPdfUrl: event.data?.resultPdfUrl,
                                      testResults: event.data?.testResults,
                                      structuredResults: event.data?.structuredResults,
                                      verifiedBy: event.data?.verifiedBy,
                                      verifiedAt: event.data?.verifiedAt,
                                      doctorRemarks: event.data?.doctorRemarks,
                                    },
                                  });
                                }}
                                activeOpacity={0.8}
                              >
                                <View style={styles.viewReportBtnContent}>
                                  <FileText size={14} color="#10b981" />
                                  <Text style={styles.viewReportBtnText}>
                                    View Report
                                  </Text>
                                </View>
                                <ChevronRight size={14} color="#10b981" />
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.shareReportActionIconBtn,
                                  {
                                    borderColor: 'rgba(16, 185, 129, 0.35)',
                                    backgroundColor: isDark
                                      ? 'rgba(16, 185, 129, 0.12)'
                                      : 'rgba(16, 185, 129, 0.08)',
                                  },
                                ]}
                                onPress={() => handleQuickShareReport(event)}
                                activeOpacity={0.8}
                              >
                                <Share2 size={14} color="#10b981" />
                              </TouchableOpacity>
                            </View>
                          )}
                        </GlassCard>
                      </View>
                    </View>
                  );
                })}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Report Viewer Modal */}
      <ReportViewerModal
        visible={!!selectedReportAppt}
        onClose={() => setSelectedReportAppt(null)}
        appointment={selectedReportAppt}
        navigation={navigation}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  refreshIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  summaryHeroCard: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  summaryTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  summaryTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  totalCountPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  totalCountText: {
    fontSize: 11,
    fontWeight: '800',
  },
  summaryDesc: {
    fontSize: 12,
    lineHeight: 17,
    marginBottom: 14,
  },
  provenanceMetricsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  metricBox: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 2,
  },
  metricSub: {
    fontSize: 10,
    fontWeight: '500',
  },
  filtersSection: {
    marginBottom: 16,
  },
  filterScroll: {
    gap: 8,
    paddingBottom: 8,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 12,
  },
  provenancePillRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  provenanceSubPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  provenanceSubPillText: {
    fontSize: 11,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 13,
  },
  emptyCard: {
    padding: 24,
    borderRadius: 18,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyIconBox: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  emptySub: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
    paddingHorizontal: 12,
  },
  clearFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  clearFilterBtnText: {
    color: '#000000',
    fontWeight: '800',
    fontSize: 12,
  },
  timelineContainer: {
    position: 'relative',
  },
  dateGroup: {
    marginBottom: 20,
  },
  dateHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  dateDivider: {
    flex: 1,
    height: 1,
  },
  timelineItemRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  spineColumn: {
    width: 32,
    alignItems: 'center',
    marginRight: 10,
  },
  timelineNode: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  verticalSpine: {
    width: 2,
    flex: 1,
    marginTop: 2,
    marginBottom: -4,
  },
  eventCardWrap: {
    flex: 1,
  },
  eventCard: {
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  eventHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 6,
  },
  eventTitle: {
    fontSize: 14,
    fontWeight: '800',
    lineHeight: 18,
  },
  eventTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  eventTimeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  eventSubtitle: {
    fontSize: 11.5,
    lineHeight: 16,
    marginBottom: 8,
  },
  vitalsChipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  vitalMetricChip: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  vitalChipLabel: {
    fontSize: 9,
    fontWeight: '800',
  },
  vitalChipVal: {
    fontSize: 11,
    fontWeight: '800',
  },
  nutritionChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  nutritionPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(168, 85, 247, 0.1)',
  },
  nutritionPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  criticalNoticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    marginTop: 8,
  },
  criticalNoticeText: {
    color: '#f43f5e',
    fontSize: 11,
    fontWeight: '700',
    flex: 1,
  },
  disclaimerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(168, 85, 247, 0.2)',
  },
  disclaimerText: {
    fontSize: 10,
    flex: 1,
    fontStyle: 'italic',
  },
  viewReportActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 10,
  },
  viewReportBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  viewReportBtnText: {
    color: '#10b981',
    fontSize: 11,
    fontWeight: '800',
  },
  labCardActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  shareReportActionIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HealthTimelineScreen;
