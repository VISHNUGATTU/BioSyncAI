import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import {
  CheckCircle2,
  Clock,
  UserCheck,
  Navigation,
  MapPin,
  KeyRound,
  FlaskConical,
  Building,
  FileCheck2,
  AlertTriangle,
  ChevronRight,
} from 'lucide-react-native';
import { colors, useTheme } from '../theme/colors';

export const LIFECYCLE_STAGES = [
  {
    stageNumber: 1,
    key: 'Booked',
    label: 'Booked',
    title: 'Patient Scheduled',
    desc: 'Diagnostic visit booked with preparation guidelines',
    Icon: Clock,
  },
  {
    stageNumber: 2,
    key: 'Assistant_Assigned',
    label: 'Assigned',
    title: 'Phlebotomist Assigned',
    desc: 'Field staff dispatched to collection sector',
    Icon: UserCheck,
  },
  {
    stageNumber: 3,
    key: 'On_The_Way',
    label: 'On Route',
    title: 'In Transit (GPS Active)',
    desc: 'Live telemetry tracking active toward doorstep',
    Icon: Navigation,
  },
  {
    stageNumber: 4,
    key: 'Arrived',
    label: 'Arrived',
    title: 'At Patient Doorstep',
    desc: 'Arrival confirmed at registered residence',
    Icon: MapPin,
  },
  {
    stageNumber: 5,
    key: 'Collecting',
    label: 'Collecting',
    title: 'Clinical Intake Active',
    desc: 'Patient OTP verified; recording baseline vitals',
    Icon: KeyRound,
  },
  {
    stageNumber: 6,
    key: 'Sample_Collected',
    label: 'Collected',
    title: 'Specimens Sealed in 4°C',
    desc: 'Barcodes scanned, verified, and cold-chain secured',
    Icon: FlaskConical,
  },
  {
    stageNumber: 7,
    key: 'At_Laboratory',
    label: 'At Lab',
    title: 'Laboratory Handover',
    desc: 'Delivered to diagnostic center for processing',
    Icon: Building,
  },
  {
    stageNumber: 8,
    key: 'Completed',
    label: 'Completed',
    title: 'Verified Report Ready',
    desc: 'Pathologist certified and released to patient',
    Icon: FileCheck2,
  },
];

export const getStageNumber = (status) => {
  switch (status) {
    case 'Booked':
    case 'Pending':
      return 1;
    case 'Assistant_Assigned':
    case 'Assigned':
      return 2;
    case 'On_The_Way':
    case 'On_Route':
      return 3;
    case 'Arrived':
      return 4;
    case 'Collecting':
      return 5;
    case 'Sample_Collected':
      return 6;
    case 'At_Laboratory':
    case 'Processing':
      return 7;
    case 'Report_Generated':
    case 'Completed':
      return 8;
    case 'Failed':
    case 'Cancelled':
    case 'No_Show':
    case 'Rejected':
      return -1;
    default:
      return 1;
  }
};

export const LifecycleStateMachine = ({
  status,
  onPressStage,
  appointmentId,
  style,
}) => {
  const { isDark } = useTheme();
  const currentStageNum = getStageNumber(status);
  const isFailed = currentStageNum === -1;

  const currentStageInfo =
    LIFECYCLE_STAGES.find((s) => s.stageNumber === currentStageNum) ||
    LIFECYCLE_STAGES[0];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : '#ffffff',
          borderColor: colors.borderSubtle,
        },
        style,
      ]}
    >
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.eyebrow, { color: colors.primaryLight }]}>
            8-STAGE FIELD PROTOCOL
          </Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {isFailed
              ? `Visit Cancelled (${status})`
              : `Stage ${currentStageNum} of 8: ${currentStageInfo.title}`}
          </Text>
        </View>

        <View
          style={[
            styles.stageBadge,
            {
              backgroundColor: isFailed
                ? 'rgba(239, 68, 68, 0.15)'
                : currentStageNum === 8
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(6, 182, 212, 0.15)',
              borderColor: isFailed
                ? '#ef4444'
                : currentStageNum === 8
                ? colors.emeraldLight
                : colors.cyan,
            },
          ]}
        >
          <Text
            style={[
              styles.stageBadgeText,
              {
                color: isFailed
                  ? '#ef4444'
                  : currentStageNum === 8
                  ? colors.emeraldLight
                  : colors.cyan,
              },
            ]}
          >
            {isFailed ? status.toUpperCase() : `STAGE ${currentStageNum}/8`}
          </Text>
        </View>
      </View>

      {/* Horizontal Stepper Track */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.stepperScroll}
      >
        {LIFECYCLE_STAGES.map((stage, idx) => {
          const isDone = currentStageNum > stage.stageNumber;
          const isCurrent = currentStageNum === stage.stageNumber;
          const isUpcoming = currentStageNum < stage.stageNumber;

          return (
            <React.Fragment key={stage.key}>
              <TouchableOpacity
                style={styles.stageStepItem}
                onPress={() => onPressStage && onPressStage(stage)}
                activeOpacity={0.7}
              >
                {/* Node Circle */}
                <View
                  style={[
                    styles.nodeCircle,
                    isDone && {
                      backgroundColor: colors.emeraldLight,
                      borderColor: colors.emeraldLight,
                    },
                    isCurrent && {
                      backgroundColor: 'rgba(6, 182, 212, 0.2)',
                      borderColor: colors.cyan,
                    },
                    isUpcoming && {
                      backgroundColor: isDark ? '#111827' : '#f3f4f6',
                      borderColor: colors.borderSubtle,
                    },
                  ]}
                >
                  {isDone ? (
                    <CheckCircle2 size={14} color="#000000" strokeWidth={3} />
                  ) : (
                    <Text
                      style={[
                        styles.nodeNumber,
                        {
                          color: isCurrent
                            ? colors.cyan
                            : colors.textMuted,
                        },
                      ]}
                    >
                      {stage.stageNumber}
                    </Text>
                  )}
                </View>

                {/* Stage Label */}
                <Text
                  style={[
                    styles.nodeLabel,
                    {
                      color: isCurrent
                        ? colors.cyan
                        : isDone
                        ? colors.textPrimary
                        : colors.textMuted,
                      fontWeight: isCurrent ? '900' : '700',
                    },
                  ]}
                  numberOfLines={1}
                >
                  {stage.label}
                </Text>
              </TouchableOpacity>

              {/* Connecting Bar (except after last step) */}
              {idx < LIFECYCLE_STAGES.length - 1 && (
                <View
                  style={[
                    styles.connectorLine,
                    {
                      backgroundColor:
                        currentStageNum > stage.stageNumber
                          ? colors.emeraldLight
                          : 'rgba(255, 255, 255, 0.1)',
                    },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </ScrollView>

      {/* Active Stage Protocol Context Box */}
      <View
        style={[
          styles.protocolBox,
          {
            backgroundColor: isDark ? 'rgba(6, 182, 212, 0.06)' : '#ecfeff',
            borderColor: isDark ? 'rgba(6, 182, 212, 0.25)' : '#a5f3fc',
          },
        ]}
      >
        <View style={styles.protocolIconWrap}>
          <currentStageInfo.Icon size={18} color={colors.cyan} />
        </View>

        <View style={{ flex: 1, marginLeft: 10 }}>
          <Text style={[styles.protocolTitle, { color: colors.textPrimary }]}>
            {currentStageInfo.title}
          </Text>
          <Text style={[styles.protocolDesc, { color: colors.textSecondary }]}>
            {currentStageInfo.desc}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eyebrow: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 2,
  },
  title: {
    fontSize: 13,
    fontWeight: '800',
  },
  stageBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  stageBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  stepperScroll: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  stageStepItem: {
    alignItems: 'center',
    width: 60,
  },
  nodeCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 5,
  },
  nodeNumber: {
    fontSize: 11,
    fontWeight: '900',
  },
  nodeLabel: {
    fontSize: 9.5,
    textAlign: 'center',
  },
  connectorLine: {
    width: 18,
    height: 2,
    marginBottom: 18,
  },
  protocolBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
  },
  protocolIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  protocolTitle: {
    fontSize: 11.5,
    fontWeight: '800',
  },
  protocolDesc: {
    fontSize: 10,
    marginTop: 1,
    lineHeight: 14,
  },
});

export default LifecycleStateMachine;
