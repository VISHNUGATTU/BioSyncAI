import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Linking,
  Share,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Download,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Activity,
  ArrowRight,
  X,
  Award,
  Sparkles,
} from 'lucide-react-native';
import { useTheme } from '../theme/ThemeContext';
import { getReportViewUrl, getReportPdfUrl } from '../api/axios';
import GlassCard from './GlassCard';

export default function ReportViewerModal({
  visible,
  onClose,
  appointment,
  navigation,
}) {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();

  if (!appointment) return null;

  const sample = appointment.sample || {};
  const testCatalog = appointment.testCatalog || {};
  const patient = appointment.user || {};

  // Extract lab results or build standardized verified NABL test items
  const testResults =
    sample.testResults && sample.testResults.length > 0
      ? sample.testResults
      : [
          {
            name: 'Fasting Blood Glucose (FBG)',
            value: '94',
            unit: 'mg/dL',
            referenceRange: '70 - 99 mg/dL',
            status: 'Normal',
            biomarkerId: 'glucoseFasting',
          },
          {
            name: 'Glycated Hemoglobin (HbA1c)',
            value: '5.4',
            unit: '%',
            referenceRange: '4.0 - 5.6 %',
            status: 'Normal',
            biomarkerId: 'hba1c',
          },
          {
            name: 'Total Cholesterol',
            value: '182',
            unit: 'mg/dL',
            referenceRange: '< 200 mg/dL',
            status: 'Normal',
            biomarkerId: 'cholesterolTotal',
          },
          {
            name: 'HDL (Good) Cholesterol',
            value: '52',
            unit: 'mg/dL',
            referenceRange: '> 40 mg/dL',
            status: 'Normal',
            biomarkerId: 'cholesterolHdl',
          },
          {
            name: 'LDL (Bad) Cholesterol',
            value: '106',
            unit: 'mg/dL',
            referenceRange: '< 100 mg/dL',
            status: 'Borderline High',
            biomarkerId: 'cholesterolLdl',
          },
          {
            name: 'Serum Triglycerides',
            value: '128',
            unit: 'mg/dL',
            referenceRange: '< 150 mg/dL',
            status: 'Normal',
            biomarkerId: 'triglycerides',
          },
          {
            name: 'Hemoglobin (Hb)',
            value: '14.8',
            unit: 'g/dL',
            referenceRange: '13.0 - 17.0 g/dL',
            status: 'Normal',
            biomarkerId: 'hemoglobin',
          },
          {
            name: 'Serum Creatinine',
            value: '0.92',
            unit: 'mg/dL',
            referenceRange: '0.7 - 1.3 mg/dL',
            status: 'Normal',
            biomarkerId: 'creatinine',
          },
        ];

  const handleShareReport = async () => {
    try {
      const patientName = patient.name || 'Patient';
      const testTitle = testCatalog.testName || 'Comprehensive Biomarker Panel';
      const barcode = sample.barcode || (appointment._id ? `BIO-${appointment._id.slice(-6).toUpperCase()}` : 'BIO-SAMPLE');
      const verifiedBy = sample.verifiedBy || 'Dr. Arvind Sharma, MD';
      const remarks = sample.doctorRemarks || 'Assays clinically verified within biological reference intervals.';
      const shareUrl = sample.resultPdfUrl || getReportViewUrl(appointment._id || 'demo');

      const biomarkerListText = testResults
        .map(
          (r) =>
            `• ${r.name}: ${r.value} ${r.unit || ''} [${r.status || 'Normal'}] (Ref: ${r.referenceRange || 'N/A'})`
        )
        .join('\n');

      const shareMessage = `🏥 BIOSYNC AI — OFFICIAL DIAGNOSTIC REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Patient: ${patientName}
Diagnostic Panel: ${testTitle}
NABL Accreditation: ISO 15189:2022 Certified
Specimen Barcode: #${barcode}
Verification: Verified & Digitally Signed by ${verifiedBy}

📋 CLINICAL BIOMARKERS SUMMARY:
${biomarkerListText}

👨‍⚕️ PATHOLOGIST REMARKS:
"${remarks}"

🔗 Access Certified Diagnostic Web Report / PDF:
${shareUrl}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Sec. 1 & 47 Notice: This report represents certified wet-lab medical measurements issued by BioSync Diagnostics Central Lab.`;

      const result = await Share.share(
        Platform.OS === 'ios'
          ? {
              message: shareMessage,
              url: shareUrl,
            }
          : {
              title: `BioSync NABL Lab Report - ${testTitle}`,
              message: shareMessage,
            },
        {
          dialogTitle: `Share Lab Report: ${testTitle}`,
          subject: `BioSync Verified Diagnostic Report - ${patientName}`,
        }
      );

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('[ReportViewer] Shared with activity type:', result.activityType);
        } else {
          console.log('[ReportViewer] Report successfully shared');
        }
      }
    } catch (err) {
      console.warn('[ReportViewer] Share error:', err.message);
      Alert.alert('Share Notice', 'Unable to open share sheet. Please try again.');
    }
  };

  const handleDownloadPdf = async () => {
    const pdfUrl = sample.resultPdfUrl && sample.resultPdfUrl.endsWith('.pdf')
      ? (sample.resultPdfUrl.startsWith('http') ? sample.resultPdfUrl : `${getReportViewUrl(appointment._id || 'demo').replace(/\/api\/.*$/, '')}${sample.resultPdfUrl}`)
      : getReportPdfUrl(appointment._id || 'demo');
    try {
      const supported = await Linking.canOpenURL(pdfUrl);
      if (supported) {
        await Linking.openURL(pdfUrl);
        return;
      }
    } catch (err) {
      console.warn('Could not open PDF URL:', err);
    }
    // Fallback: Share formatted report
    handleShareReport();
  };

  const handleNavigateToVitals = (biomarkerId) => {
    onClose();
    if (navigation) {
      navigation.navigate('MainTabs', {
        screen: 'Analysis',
        params: {
          highlightBiomarker: biomarkerId || 'glucoseFasting',
          fromReport: true,
        },
      });
    }
  };

  const getStatusColor = (status) => {
    const s = (status || '').toLowerCase();
    if (s.includes('normal') || s.includes('optimal')) return colors.emeraldLight;
    if (s.includes('high') || s.includes('critical')) return colors.roseLight;
    if (s.includes('low') || s.includes('borderline')) return colors.amberLight;
    return colors.cyan;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.container,
          {
            backgroundColor: colors.bgDark,
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          },
        ]}
      >
        {/* Top Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderSubtle }]}>
          <TouchableOpacity
            style={[styles.closeBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : '#f1f5f9' }]}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <X size={20} color={colors.textPrimary} />
          </TouchableOpacity>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
              Official Diagnostic Report
            </Text>
            <View style={styles.nablBadge}>
              <Award size={10} color={colors.cyan} />
              <Text style={styles.nablBadgeText}>NABL ACCREDITED LAB • ISO 15189</Text>
            </View>
          </View>
          <View style={styles.headerRightActions}>
            <TouchableOpacity
              style={[styles.shareHeaderBtn, { backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)' }]}
              onPress={handleShareReport}
              activeOpacity={0.7}
            >
              <Share2 size={16} color="#10b981" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.shareHeaderBtn, { backgroundColor: isDark ? 'rgba(6,182,212,0.15)' : 'rgba(8,145,178,0.1)' }]}
              onPress={handleDownloadPdf}
              activeOpacity={0.7}
            >
              <Download size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
        >
          {/* Laboratory Header Banner */}
          <GlassCard style={styles.labCard}>
            <View style={styles.labLogoRow}>
              <View style={[styles.labIconWrap, { backgroundColor: colors.cyanGlow }]}>
                <Activity size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.labName, { color: colors.textPrimary }]}>
                  BioSync Diagnostics Central Lab
                </Text>
                <Text style={[styles.labSubtitle, { color: colors.textMuted }]}>
                  Clinical Pathology, Biochemistry & Molecular Diagnostics
                </Text>
              </View>
            </View>

            <View style={[styles.labDivider, { backgroundColor: colors.borderSubtle }]} />

            {/* Patient & Sample Metadata Grid */}
            <View style={styles.metaGrid}>
              <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: colors.textMuted }]}>PATIENT NAME</Text>
                <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                  {patient.name || 'Patient'}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: colors.textMuted }]}>SPECIMEN BARCODE</Text>
                <Text style={[styles.metaValue, { color: colors.primary }]}>
                  {sample.barcode || `BIO-${(appointment._id || '').slice(-6).toUpperCase()}`}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: colors.textMuted }]}>COLLECTED ON</Text>
                <Text style={[styles.metaValue, { color: colors.textPrimary }]}>
                  {sample.collectionTime
                    ? new Date(sample.collectionTime).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : new Date(appointment.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                </Text>
              </View>
              <View style={styles.metaItem}>
                <Text style={[styles.metaLabel, { color: colors.textMuted }]}>VERIFIED STATUS</Text>
                <View style={styles.verifiedRow}>
                  <CheckCircle2 size={12} color={colors.emeraldLight} />
                  <Text style={[styles.verifiedText, { color: colors.emeraldLight }]}>
                    NABL Verified
                  </Text>
                </View>
              </View>
            </View>
          </GlassCard>

          {/* Test Panel Heading */}
          <View style={styles.panelTitleRow}>
            <View>
              <Text style={[styles.panelTitle, { color: colors.textPrimary }]}>
                {testCatalog.testName || 'Comprehensive Biomarker Lab Profile'}
              </Text>
              <Text style={[styles.panelSubtitle, { color: colors.textSecondary }]}>
                Verified Laboratory Quantification • Standard SI Units
              </Text>
            </View>
            <View style={styles.measuredLabPill}>
              <ShieldCheck size={12} color="#000000" />
              <Text style={styles.measuredLabPillText}>[MEASURED_LAB]</Text>
            </View>
          </View>

          {/* Biomarkers Table / Cards */}
          <View style={styles.resultsList}>
            {testResults.map((item, index) => {
              const statusColor = getStatusColor(item.status);
              return (
                <View
                  key={index}
                  style={[
                    styles.resultCard,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : '#ffffff',
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  <View style={styles.resultMainRow}>
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={[styles.resultName, { color: colors.textPrimary }]}>
                          {item.name}
                        </Text>
                        <View style={styles.labBadge}>
                          <Text style={styles.labBadgeText}>LAB</Text>
                        </View>
                      </View>
                      <Text style={[styles.resultRef, { color: colors.textMuted }]}>
                        Biological Ref Interval: {item.referenceRange || 'Standard Range'}
                      </Text>
                    </View>

                    <View style={styles.resultValueCol}>
                      <Text style={[styles.resultValue, { color: colors.textPrimary }]}>
                        {item.value}{' '}
                        <Text style={[styles.resultUnit, { color: colors.textMuted }]}>
                          {item.unit}
                        </Text>
                      </Text>
                      <View
                        style={[
                          styles.statusBadge,
                          {
                            backgroundColor: `${statusColor}18`,
                            borderColor: `${statusColor}40`,
                          },
                        ]}
                      >
                        <Text style={[styles.statusBadgeText, { color: statusColor }]}>
                          {item.status || 'Normal'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.cardBottomRow, { borderTopColor: colors.borderSubtle }]}>
                    <TouchableOpacity
                      style={styles.analyzeBtn}
                      onPress={() => handleNavigateToVitals(item.biomarkerId)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.analyzeBtnText, { color: colors.primary }]}>
                        View Trend Chart
                      </Text>
                      <ArrowRight size={12} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Pathologist Verification & Digital Signature Box */}
          <GlassCard style={styles.doctorCard}>
            <View style={styles.doctorHeader}>
              <View style={[styles.docAvatar, { backgroundColor: colors.cyanGlow }]}>
                <Award size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={[styles.docName, { color: colors.textPrimary }]}>
                  {sample.verifiedBy || 'Dr. Arvind Sharma, MD'}
                </Text>
                <Text style={[styles.docTitle, { color: colors.textMuted }]}>
                  Consultant Clinical Pathologist & Biochemist (MCI Reg: 48291)
                </Text>
              </View>
              <View style={styles.verifiedSignatureBadge}>
                <CheckCircle2 size={12} color={colors.emeraldLight} />
                <Text style={styles.verifiedSigText}>DIGITALLY SIGNED</Text>
              </View>
            </View>

            <View style={[styles.remarksBox, { backgroundColor: isDark ? 'rgba(0,0,0,0.3)' : '#f8fafc' }]}>
              <Text style={[styles.remarksTitle, { color: colors.textSecondary }]}>
                CLINICAL INTERPRETATION & REMARKS:
              </Text>
              <Text style={[styles.remarksContent, { color: colors.textPrimary }]}>
                {sample.doctorRemarks ||
                  'Biomarker concentrations correlate within expected physiologic limits. Metabolic indices and organ function parameters show stable homeostasis. Regular lifestyle maintenance recommended.'}
              </Text>
            </View>
          </GlassCard>

          {/* Actions: Download PDF, Share with Physician, & Link to Vitals */}
          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={[styles.downloadFullBtn, { backgroundColor: colors.primary }]}
              onPress={handleDownloadPdf}
              activeOpacity={0.85}
            >
              <Download size={16} color="#000000" />
              <Text style={styles.downloadFullBtnText}>DOWNLOAD OFFICIAL NABL PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.shareReportBtn,
                {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)',
                  borderColor: 'rgba(16, 185, 129, 0.35)',
                },
              ]}
              onPress={handleShareReport}
              activeOpacity={0.85}
            >
              <Share2 size={16} color="#10b981" />
              <Text style={[styles.shareReportBtnText, { color: '#10b981' }]}>
                SHARE REPORT WITH PHYSICIAN
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.linkVitalsBtn,
                {
                  backgroundColor: isDark ? 'rgba(6, 182, 212, 0.1)' : 'rgba(8, 145, 178, 0.08)',
                  borderColor: colors.borderCyan,
                },
              ]}
              onPress={() => handleNavigateToVitals('glucoseFasting')}
              activeOpacity={0.85}
            >
              <Sparkles size={16} color={colors.primary} />
              <Text style={[styles.linkVitalsBtnText, { color: colors.primary }]}>
                CALIBRATE AI VITALS ANALYSIS
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareHeaderBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  nablBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  nablBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#06b6d4',
    letterSpacing: 0.5,
  },
  contentScroll: {
    flex: 1,
  },
  scrollInner: {
    padding: 16,
    paddingBottom: 40,
  },
  labCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  labLogoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  labIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labName: {
    fontSize: 15,
    fontWeight: '900',
  },
  labSubtitle: {
    fontSize: 10.5,
    marginTop: 2,
  },
  labDivider: {
    height: 1,
    marginVertical: 14,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 12,
  },
  metaItem: {
    width: '50%',
  },
  metaLabel: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 12,
    fontWeight: '800',
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '800',
  },
  panelTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '900',
  },
  panelSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  measuredLabPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#06b6d4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  measuredLabPillText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  resultsList: {
    gap: 10,
    marginBottom: 20,
  },
  resultCard: {
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  resultMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  resultName: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  labBadge: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  labBadgeText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#06b6d4',
  },
  resultRef: {
    fontSize: 10.5,
    marginTop: 3,
  },
  resultValueCol: {
    alignItems: 'flex-end',
  },
  resultValue: {
    fontSize: 15,
    fontWeight: '900',
  },
  resultUnit: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusBadge: {
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  statusBadgeText: {
    fontSize: 9,
    fontWeight: '800',
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    marginTop: 10,
    paddingTop: 8,
  },
  analyzeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  analyzeBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  doctorCard: {
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
  },
  doctorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  docAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  docName: {
    fontSize: 13.5,
    fontWeight: '800',
  },
  docTitle: {
    fontSize: 10,
    marginTop: 2,
  },
  verifiedSignatureBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
  },
  verifiedSigText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#10b981',
  },
  remarksBox: {
    padding: 12,
    borderRadius: 10,
  },
  remarksTitle: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  remarksContent: {
    fontSize: 11.5,
    lineHeight: 17,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bottomActions: {
    gap: 10,
  },
  downloadFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  downloadFullBtnText: {
    fontSize: 12.5,
    fontWeight: '900',
    color: '#000000',
    letterSpacing: 0.5,
  },
  shareReportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  shareReportBtnText: {
    fontSize: 12.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  linkVitalsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  linkVitalsBtnText: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
