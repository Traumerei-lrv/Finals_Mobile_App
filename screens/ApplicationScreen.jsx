import React, { useEffect, useMemo, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Dimensions,
  Platform,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAppliedJobs } from '../utils/storage';
import SidebarMenu from '../components/SidebarMenu';

const { width } = Dimensions.get('window');

const COLORS = {
  primary: '#1a365d',
  secondary: '#5d7291',
  surface: '#f9f9ff',
  surfaceContainer: '#e2e7f9',
  surfaceContainerLow: '#f0f3ff',
  surfaceContainerHigh: '#d4dbf4',
  onSurface: '#1a365d',
  onSurfaceVariant: '#5d7291',
  outline: '#cfdaf1',
  white: '#ffffff',
  accentBlue: '#00a8e1',
  accentYellow: '#f9b208',
  statusInterview: '#8AB4F8',
  statusReview: '#e2e7f9',
  statusDeclined: '#FEE2E2',
  statusDeclinedText: '#B91C1C',
  tagBg: '#E2E7F9',
};

// ─── Sample job data ──────────────────────────────────────────────────────────
const APPLICATIONS = [
  {
    id: '1',
    role: 'Senior Product Designer',
    company: 'StellarTech Solutions',
    date: 'Applied Oct 12, 2023',
    status: 'INTERVIEW SCHEDULED',
    statusType: 'interview',
    step: 'Step 3 of 4',
    progress: 0.75,
    icon: 'molecule',
    location: 'San Francisco, CA',
    salary: '$160k – $200k',
    salaryPeriod: '/ year',
    tags: ['FULL-TIME', 'HYBRID', 'DESIGN'],
    about:
      'As a Senior Product Designer at StellarTech Solutions, you will craft intuitive, beautiful experiences for millions of users worldwide. Work closely with engineers, PMs, and researchers to solve complex design challenges and ship elegant solutions.',
    responsibilities: [
      'Lead end-to-end design for core product features from concept to launch.',
      'Develop high-fidelity prototypes and design systems that ensure cross-platform consistency.',
      'Conduct user research and usability testing to validate design decisions.',
      'Mentor junior designers and contribute to internal design culture.',
    ],
    qualifications: [
      '6+ years of experience in product design or UI/UX.',
      'Expertise in Figma, Sketch, and Adobe Creative Suite.',
      'Strong portfolio demonstrating complex problem-solving and visual craft.',
    ],
  },
  {
    id: '2',
    role: 'Full-Stack Engineer',
    company: 'Global Finance Group',
    date: 'Applied Oct 08, 2023',
    status: 'UNDER REVIEW',
    statusType: 'review',
    step: 'Step 1 of 4',
    progress: 0.25,
    icon: 'flash-outline',
    location: 'New York, NY',
    salary: '$140k – $180k',
    salaryPeriod: '/ year',
    tags: ['FULL-TIME', 'ON-SITE', 'ENGINEERING'],
    about:
      'Join the Global Finance Group engineering team to build resilient, high-throughput financial systems serving institutional clients across 40+ countries.',
    responsibilities: [
      'Design and build scalable APIs and microservices in Node.js and Go.',
      'Collaborate with product teams on feature delivery and technical roadmaps.',
      'Maintain 99.99% uptime for mission-critical transaction pipelines.',
      'Participate in on-call rotations and incident response.',
    ],
    qualifications: [
      '5+ years full-stack experience (React, Node.js, PostgreSQL).',
      'Experience with financial systems or high-frequency data pipelines.',
      'Strong understanding of system design and distributed architectures.',
    ],
  },
  {
    id: '3',
    role: 'UX Researcher',
    company: 'Creative Pulse Agency',
    date: 'Applied Sep 28, 2023',
    status: 'DECLINED',
    statusType: 'declined',
    step: 'Closed',
    progress: 1,
    progressColor: COLORS.outline,
    icon: 'hexagon-outline',
    location: 'Austin, TX',
    salary: '$90k – $120k',
    salaryPeriod: '/ year',
    tags: ['FULL-TIME', 'REMOTE', 'RESEARCH'],
    about:
      'Creative Pulse Agency was seeking a UX Researcher to drive insight-led design across a portfolio of consumer brands. This position has been filled.',
    responsibilities: [
      'Plan and conduct qualitative and quantitative user research studies.',
      'Synthesise findings into actionable insights for product and design teams.',
      'Manage the research repository and evangelise a user-centred culture.',
    ],
    qualifications: [
      '3+ years in UX research or a related field.',
      'Proficiency with tools such as UserTesting, Maze, or Dovetail.',
      'Excellent written and verbal communication skills.',
    ],
  },
  {
    id: '4',
    role: 'Marketing Director',
    company: 'CloudScale Inc.',
    date: 'Applied Oct 02, 2023',
    status: 'UNDER REVIEW',
    statusType: 'review',
    step: 'Step 2 of 4',
    progress: 0.5,
    icon: 'help-circle-outline',
    location: 'Seattle, WA',
    salary: '$170k – $210k',
    salaryPeriod: '/ year',
    tags: ['FULL-TIME', 'HYBRID', 'MARKETING'],
    about:
      'CloudScale Inc. is looking for a data-driven Marketing Director to own brand strategy, demand generation, and go-to-market execution for our rapidly growing SaaS platform.',
    responsibilities: [
      'Define and execute the company-wide marketing strategy and OKRs.',
      'Lead a team of 12 across content, growth, brand, and product marketing.',
      'Own the full-funnel demand generation programme and marketing P&L.',
      'Partner with sales leadership on pipeline targets and ABM campaigns.',
    ],
    qualifications: [
      '8+ years in B2B SaaS marketing, with 3+ years in a leadership role.',
      'Proven track record of driving pipeline growth and brand awareness.',
      'Strong analytical skills and comfort with marketing attribution tools.',
    ],
  },
];

function mapAppliedJobToApplication(job) {
  const now = new Date();
  const appliedDate = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return {
    id: `submitted-${job.id}`,
    role: job.role,
    company: job.company,
    date: `Applied ${appliedDate}`,
    status: 'UNDER REVIEW',
    statusType: 'review',
    step: 'Step 1 of 4',
    progress: 0.25,
    icon: job.icon ?? 'file-document-outline',
    location: job.location ?? 'Remote',
    salary: job.salary ?? 'Competitive',
    salaryPeriod: job.salaryPeriod ?? '/ year',
    tags: Array.isArray(job.tags) && job.tags.length ? job.tags : [job.type ?? 'FULL-TIME'],
    about:
      job.about ??
      `${job.company} is reviewing your application for ${job.role}. We will share the next steps soon.`,
    responsibilities: Array.isArray(job.responsibilities) && job.responsibilities.length
      ? job.responsibilities
      : ['Application submitted successfully.', 'Awaiting recruiter review.'],
    qualifications: Array.isArray(job.qualifications) && job.qualifications.length
      ? job.qualifications
      : ['Profile submitted', 'Resume uploaded'],
  };
}

// ─── Main screen ──────────────────────────────────────────────────────────────
const MyApplicationsScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState('All');
  const [selectedJob, setSelectedJob] = useState(null);
  const [submittedApplications, setSubmittedApplications] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const tabs = ['All', 'Active', 'Interviews', 'Archive'];

  useEffect(() => {
    let isMounted = true;

    const hydrateAppliedJobs = async () => {
      const appliedJobs = await getAppliedJobs();
      if (isMounted) {
        setSubmittedApplications(appliedJobs.map(mapAppliedJobToApplication));
      }
    };

    void hydrateAppliedJobs();

    const focusUnsubscribe = navigation.addListener('focus', () => {
      void hydrateAppliedJobs();
    });

    return () => {
      isMounted = false;
      focusUnsubscribe();
    };
  }, [navigation]);

  const allApplications = useMemo(
    () => [...submittedApplications, ...APPLICATIONS],
    [submittedApplications],
  );
  const handleOpenSidebar = () => setSidebarOpen(true);
  const handleCloseSidebar = () => setSidebarOpen(false);
  const navigateFromSidebar = (routeName) => {
    handleCloseSidebar();
    navigation.navigate(routeName);
  };

  const filteredApps = allApplications.filter((app) => {
    if (activeTab === 'All') return true;
    if (activeTab === 'Active') return app.statusType === 'review';
    if (activeTab === 'Interviews') return app.statusType === 'interview';
    if (activeTab === 'Archive') return app.statusType === 'declined';
    return true;
  });

  if (selectedJob) {
    return (
      <JobDetailView
        job={selectedJob}
        onBack={() => setSelectedJob(null)}
        navigation={navigation}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <SidebarMenu
        isOpen={sidebarOpen}
        onClose={handleCloseSidebar}
        navigation={navigation}
        activeRoute="Application"
        onItemPress={(item) => navigateFromSidebar(item.route)}
      />
      {/* Top App Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleOpenSidebar}>
          <MaterialCommunityIcons name="menu" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Applications</Text>
        <TouchableOpacity>
          <MaterialCommunityIcons name="notifications-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
          >
            <Text style={[styles.tabLabel, activeTab === tab && styles.tabLabelActive]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.applicationList}>
          {filteredApps.map((app) => (
            <ApplicationCard
              key={app.id}
              {...app}
              onPress={() => setSelectedJob(app)}
            />
          ))}
        </View>
      </ScrollView>

      {/* Bottom Nav Bar */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('Home')}>
          <MaterialCommunityIcons name="home-outline" size={24} color={COLORS.secondary} />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('Search')}>
          <MaterialCommunityIcons name="magnify" size={24} color={COLORS.secondary} />
          <Text style={styles.navLabel}>Search</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItemActive} onPress={() => navigation?.navigate('Application')}>
          <View style={styles.activeNavIndicator}>
            <MaterialCommunityIcons name="file-document" size={24} color={COLORS.primary} />
            <Text style={styles.navLabelActive}>Apps</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem} onPress={() => navigation?.navigate('Profile')}>
          <MaterialCommunityIcons name="account-outline" size={24} color={COLORS.secondary} />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ─── Application card ─────────────────────────────────────────────────────────
const ApplicationCard = ({
  role, company, date, status, statusType, step,
  progress, progressColor, icon, onPress,
}) => {
  let statusStyle = styles.statusReview;
  let statusTextStyle = styles.statusReviewText;
  if (statusType === 'interview') {
    statusStyle = styles.statusInterview;
    statusTextStyle = styles.statusInterviewText;
  } else if (statusType === 'declined') {
    statusStyle = styles.statusDeclined;
    statusTextStyle = styles.statusDeclinedText;
  }

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <View style={styles.companyLogoContainer}>
            <MaterialCommunityIcons name={icon} size={24} color={COLORS.primary} />
          </View>
          <View style={styles.titleContainer}>
            <Text style={styles.roleText}>{role}</Text>
            <Text style={styles.companyText}>{company}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, statusStyle]}>
          <Text style={[styles.statusText, statusTextStyle]}>{status}</Text>
        </View>
      </View>

      <View style={styles.cardMeta}>
        <View style={styles.dateRow}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={16} color={COLORS.secondary} />
          <Text style={styles.dateText}>{date}</Text>
        </View>
        <Text style={styles.stepText}>{step}</Text>
      </View>

      <View style={styles.progressWrapper}>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${progress * 100}%` },
              progressColor && { backgroundColor: progressColor },
            ]}
          />
        </View>
      </View>

      {/* Tap hint */}
      <View style={styles.viewDetailRow}>
        <Text style={styles.viewDetailText}>View job details</Text>
        <MaterialCommunityIcons name="chevron-right" size={16} color={COLORS.accentBlue} />
      </View>
    </TouchableOpacity>
  );
};

// ─── Job detail view ─────────────────────────────────────────────────────────
const JobDetailView = ({ job, onBack, navigation }) => {
  const [activeTab, setActiveTab] = useState('Description');
  const tabs = ['Description', 'Company', 'Reviews'];

  let statusStyle = styles.statusReview;
  let statusTextStyle = styles.statusReviewText;
  if (job.statusType === 'interview') {
    statusStyle = styles.statusInterview;
    statusTextStyle = styles.statusInterviewText;
  } else if (job.statusType === 'declined') {
    statusStyle = styles.statusDeclined;
    statusTextStyle = styles.statusDeclinedText;
  }

  return (
    <SafeAreaView style={detailStyles.container}>
      {/* Header */}
      <View style={detailStyles.header}>
        <TouchableOpacity style={detailStyles.headerButton} onPress={onBack}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        <View style={detailStyles.headerTitleContainer}>
          <Text style={detailStyles.headerTitle} numberOfLines={1}>{job.role}</Text>
          <Text style={detailStyles.headerSubtitle}>{job.company}</Text>
        </View>
        <View style={detailStyles.headerActions}>
          <TouchableOpacity style={detailStyles.headerButton}>
            <MaterialCommunityIcons name="share-variant-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
          <TouchableOpacity style={detailStyles.headerButton}>
            <MaterialCommunityIcons name="bookmark-outline" size={22} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={detailStyles.scrollContent}
      >
        {/* Hero */}
        <View style={detailStyles.heroSection}>
          <View style={detailStyles.companyLogoContainer}>
            <MaterialCommunityIcons name={job.icon} size={36} color={COLORS.primary} />
          </View>
          <Text style={detailStyles.jobTitle}>{job.role}</Text>
          <Text style={detailStyles.companyInfo}>{job.company} · {job.location}</Text>

          <View style={detailStyles.tagRow}>
            {job.tags.map((tag) => (
              <View key={tag} style={detailStyles.tag}>
                <Text style={detailStyles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>

          {/* Application status badge inside detail */}
          <View style={[detailStyles.statusBadgeHero, statusStyle]}>
            <Text style={[detailStyles.statusBadgeText, statusTextStyle]}>{job.status}</Text>
          </View>

          <View style={detailStyles.salaryContainer}>
            <Text style={detailStyles.salaryAmount}>{job.salary}</Text>
            <Text style={detailStyles.salaryPeriod}> {job.salaryPeriod}</Text>
          </View>
        </View>

        {/* Progress row */}
        <View style={detailStyles.progressSection}>
          <View style={detailStyles.progressMeta}>
            <Text style={detailStyles.progressLabel}>Application progress</Text>
            <Text style={detailStyles.progressStep}>{job.step}</Text>
          </View>
          <View style={detailStyles.progressBarBackground}>
            <View
              style={[
                detailStyles.progressBarFill,
                { width: `${job.progress * 100}%` },
                job.progressColor && { backgroundColor: job.progressColor },
              ]}
            />
          </View>
        </View>

        {/* Content tabs */}
        <View style={detailStyles.tabContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[detailStyles.tabItem, activeTab === tab && detailStyles.tabItemActive]}
            >
              <Text style={[detailStyles.tabText, activeTab === tab && detailStyles.tabTextActive]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={detailStyles.contentPadding}>
          {activeTab === 'Description' && (
            <>
              <Text style={detailStyles.sectionTitle}>About the role</Text>
              <Text style={detailStyles.sectionBody}>{job.about}</Text>

              <Text style={detailStyles.sectionTitle}>Responsibilities</Text>
              {job.responsibilities.map((item, i) => (
                <BulletItem key={i} text={item} />
              ))}

              <Text style={detailStyles.sectionTitle}>Qualifications</Text>
              {job.qualifications.map((item, i) => (
                <CheckItem key={i} text={item} />
              ))}
            </>
          )}
          {activeTab === 'Company' && (
            <Text style={detailStyles.sectionBody}>Company information coming soon...</Text>
          )}
          {activeTab === 'Reviews' && (
            <Text style={detailStyles.sectionBody}>Reviews coming soon...</Text>
          )}
        </View>
      </ScrollView>

      {/* Bottom bar */}
      <View style={detailStyles.bottomBar}>
        <TouchableOpacity style={detailStyles.saveButton}>
          <MaterialCommunityIcons name="bookmark-outline" size={24} color={COLORS.primary} />
        </TouchableOpacity>
        {job.statusType !== 'declined' ? (
          <TouchableOpacity
            style={detailStyles.applyButton}
            onPress={() => navigation?.navigate('TrackApplication', { job })}
          >
            <Text style={detailStyles.applyButtonText}>
              {job.statusType === 'interview' ? 'View Interview Details' : 'Continue Application'}
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={[detailStyles.applyButton, detailStyles.applyButtonDisabled]}>
            <Text style={detailStyles.applyButtonText}>Application Closed</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

// ─── Shared sub-components ────────────────────────────────────────────────────
const BulletItem = ({ text }) => (
  <View style={detailStyles.listItem}>
    <MaterialCommunityIcons
      name="check-circle-outline"
      size={18}
      color={COLORS.accentBlue}
      style={detailStyles.listIcon}
    />
    <Text style={detailStyles.listItemText}>{text}</Text>
  </View>
);

const CheckItem = ({ text }) => (
  <View style={detailStyles.listItem}>
    <MaterialCommunityIcons
      name="check-decagram-outline"
      size={18}
      color={COLORS.secondary}
      style={detailStyles.listIcon}
    />
    <Text style={detailStyles.listItemText}>{text}</Text>
  </View>
);

// ─── Styles: list screen ──────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.surface },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.primary,
    fontFamily: Platform.OS === 'ios' ? 'Hanken Grotesk' : 'sans-serif',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
  },
  tabItem: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  tabItemActive: { backgroundColor: COLORS.primary },
  tabLabel: { fontSize: 14, fontWeight: '600', color: COLORS.secondary },
  tabLabelActive: { color: COLORS.white },
  scrollContent: { paddingBottom: 100 },
  applicationList: { padding: 20, gap: 16 },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cardHeaderLeft: { flexDirection: 'row', gap: 12, flex: 1 },
  companyLogoContainer: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: COLORS.surfaceContainerLow,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.outline,
  },
  titleContainer: { flex: 1 },
  roleText: { fontSize: 18, fontWeight: '700', color: COLORS.primary, marginBottom: 4 },
  companyText: { fontSize: 14, color: COLORS.secondary },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, maxWidth: 110 },
  statusText: { fontSize: 10, fontWeight: '800', textAlign: 'center' },
  statusInterview: { backgroundColor: COLORS.statusInterview },
  statusInterviewText: { color: COLORS.primary },
  statusReview: { backgroundColor: COLORS.statusReview },
  statusReviewText: { color: COLORS.primary },
  statusDeclined: { backgroundColor: COLORS.statusDeclined },
  statusDeclinedText: { color: COLORS.statusDeclinedText },
  cardMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateText: { fontSize: 12, color: COLORS.secondary, fontWeight: '500' },
  stepText: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  progressWrapper: { height: 8, width: '100%' },
  progressBarBackground: {
    height: 8,
    width: '100%',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  viewDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 10,
    gap: 2,
  },
  viewDetailText: { fontSize: 12, color: COLORS.accentBlue, fontWeight: '600' },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.outline,
  },
  navItem: { flex: 1, alignItems: 'center', gap: 4 },
  navItemActive: { flex: 1, alignItems: 'center' },
  activeNavIndicator: {
    backgroundColor: '#8AB4F8',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navLabel: { fontSize: 11, color: COLORS.secondary, fontWeight: '600' },
  navLabelActive: { fontSize: 11, color: COLORS.primary, fontWeight: '800' },
});

// ─── Styles: detail view ──────────────────────────────────────────────────────
const detailStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.white },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
    backgroundColor: COLORS.white,
  },
  headerButton: { padding: 8 },
  headerTitleContainer: { flex: 1, paddingHorizontal: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: COLORS.primary },
  headerSubtitle: { fontSize: 12, color: COLORS.secondary },
  headerActions: { flexDirection: 'row' },
  scrollContent: { paddingBottom: 110 },
  heroSection: {
    alignItems: 'center',
    padding: 24,
    backgroundColor: COLORS.surfaceContainerLow,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 8,
  },
  companyLogoContainer: {
    width: 80,
    height: 80,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.outline,
    padding: 12,
  },
  jobTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  companyInfo: { fontSize: 16, color: COLORS.secondary, fontWeight: '500', marginBottom: 16 },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 14,
  },
  tag: {
    backgroundColor: COLORS.tagBg,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: { fontSize: 10, fontWeight: '800', color: COLORS.primary },
  statusBadgeHero: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    marginBottom: 16,
  },
  statusBadgeText: { fontSize: 11, fontWeight: '800' },
  salaryContainer: { flexDirection: 'row', alignItems: 'baseline' },
  salaryAmount: { fontSize: 32, fontWeight: '800', color: COLORS.primary },
  salaryPeriod: { fontSize: 16, color: COLORS.secondary, fontWeight: '500' },
  progressSection: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
  },
  progressMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  progressLabel: { fontSize: 12, color: COLORS.secondary, fontWeight: '500' },
  progressStep: { fontSize: 12, fontWeight: '700', color: COLORS.primary },
  progressBarBackground: {
    height: 8,
    width: '100%',
    backgroundColor: COLORS.surfaceContainer,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.outline,
  },
  tabItem: {
    paddingVertical: 16,
    marginRight: 24,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  tabItemActive: { borderBottomColor: COLORS.primary },
  tabText: { fontSize: 15, fontWeight: '700', color: COLORS.secondary },
  tabTextActive: { color: COLORS.primary },
  contentPadding: { padding: 20 },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 24,
    marginBottom: 16,
  },
  sectionBody: { fontSize: 15, color: COLORS.secondary, lineHeight: 24 },
  listItem: { flexDirection: 'row', marginBottom: 16, alignItems: 'flex-start' },
  listIcon: { marginTop: 2, marginRight: 12 },
  listItemText: { flex: 1, fontSize: 15, color: COLORS.secondary, lineHeight: 22 },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.outline,
    gap: 16,
  },
  saveButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.outline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    height: 56,
  },
  applyButtonDisabled: { backgroundColor: COLORS.secondary },
  applyButtonText: { color: COLORS.white, fontSize: 16, fontWeight: '700' },
});

export default MyApplicationsScreen;
