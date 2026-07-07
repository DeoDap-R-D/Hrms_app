import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import dayjs from 'dayjs';

import { FocusAwareStatusBar } from '../../components/ui';
import RefDatePickerModal from '../../components/RefDatePickerModal';
import { ref } from '../../theme/refColors';
import { useAuth } from '../../context/AuthContext';
import { loadRangeData } from './reportData';
import type { AppStackParamList } from '../../navigation/types';

const OPTIONS = ['Periodic Report', 'Periodic Performance Report', 'Access Control Report'];

export default function PeriodicReportScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { user } = useAuth();

  const [from, setFrom] = useState(dayjs());
  const [to, setTo] = useState(dayjs().add(7, 'day'));
  const [picker, setPicker] = useState<null | 'from' | 'to'>(null);
  const [type, setType] = useState(OPTIONS[0]);
  const [generating, setGenerating] = useState(false);

  const triggerRef = useRef<View>(null);
  const [anchor, setAnchor] = useState({ x: 0, y: 0, w: 0, h: 0 });
  const [open, setOpen] = useState(false);

  const openDropdown = () => {
    triggerRef.current?.measureInWindow((x, y, w, h) => {
      setAnchor({ x, y, w, h });
      setOpen(true);
    });
  };

  const onGenerate = async () => {
    if (generating) return;
    setGenerating(true);
    try {
      const fromStr = from.format('YYYY-MM-DD');
      const toStr = to.format('YYYY-MM-DD');
      const { records } = await loadRangeData(fromStr, toStr, user);
      if (records.length > 0) {
        navigation.navigate('PeriodicReportViewer', { type, from: fromStr, to: toStr });
      } else {
        Alert.alert('Record Not Found');
      }
    } catch {
      Alert.alert('Record Not Found');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <View style={styles.root}>
      <FocusAwareStatusBar barStyle="dark-content" />

      <SafeAreaView edges={['top']} style={styles.topBar}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Icon name="arrow-left" size={24} color={ref.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Periodic Report</Text>
        </View>
      </SafeAreaView>

      <View style={styles.body}>
        {/* From / To date fields */}
        <View style={styles.dateRow}>
          <TouchableOpacity style={[styles.dateField, styles.dateHalf]} activeOpacity={0.8} onPress={() => setPicker('from')}>
            <Icon name="calendar-clock" size={22} color={ref.blue} style={styles.dateIcon} />
            <Text style={styles.dateText}>{from.format('DD/MM/YYYY')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.dateField, styles.dateHalf]} activeOpacity={0.8} onPress={() => setPicker('to')}>
            <Icon name="calendar-clock" size={22} color={ref.blue} style={styles.dateIcon} />
            <Text style={styles.dateText}>{to.format('DD/MM/YYYY')}</Text>
          </TouchableOpacity>
        </View>

        {/* Type dropdown */}
        <Text style={styles.label}>Periodic Report</Text>
        <View ref={triggerRef} collapsable={false}>
          <TouchableOpacity style={styles.dropdownTrigger} activeOpacity={0.8} onPress={openDropdown}>
            <Text style={styles.dropdownValue}>{type}</Text>
            <Icon name="chevron-down" size={24} color={ref.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Generate */}
        <TouchableOpacity style={styles.generateBtn} activeOpacity={0.9} onPress={onGenerate} disabled={generating}>
          {generating ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.generateText}>Generate Report</Text>}
        </TouchableOpacity>
      </View>

      {/* Dropdown options */}
      <Modal visible={open} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.flex} onPress={() => setOpen(false)}>
          <View style={[styles.dropdown, { top: anchor.y + anchor.h + 6, left: anchor.x, width: anchor.w }]}>
            <View style={styles.dropdownBar} />
            <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator>
              {OPTIONS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={styles.optionRow}
                  activeOpacity={0.7}
                  onPress={() => {
                    setType(opt);
                    setOpen(false);
                  }}>
                  <Text style={[styles.optionText, opt === type && styles.optionTextActive]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>

      {/* Date pickers */}
      <RefDatePickerModal
        visible={picker === 'from'}
        value={from}
        onSelect={d => {
          // Auto-set the end date to a 7-day range from the chosen start date.
          setFrom(d);
          setTo(d.add(7, 'day'));
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
      <RefDatePickerModal
        visible={picker === 'to'}
        value={to}
        minimumDate={from.add(7, 'day')}
        onSelect={d => {
          setTo(d);
          setPicker(null);
        }}
        onClose={() => setPicker(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: ref.pageBg },
  flex: { flex: 1 },

  topBar: { backgroundColor: '#FFFFFF' },
  headerRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 16 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: ref.text, marginLeft: 20, letterSpacing: -0.3 },

  body: { paddingHorizontal: 20, paddingTop: 20 },

  dateRow: { flexDirection: 'row', gap: 14 },
  dateHalf: { flex: 1 },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: ref.blue,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  dateIcon: { marginRight: 10 },
  dateText: { fontSize: 17, color: ref.text, fontWeight: '500' },

  label: { fontSize: 16, color: ref.text, fontWeight: '500', marginTop: 24, marginBottom: 10 },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },
  dropdownValue: { fontSize: 18, color: ref.text, fontWeight: '500' },

  generateBtn: {
    backgroundColor: ref.blue,
    borderRadius: 12,
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  generateText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', letterSpacing: 0.2 },

  dropdown: {
    position: 'absolute',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  dropdownBar: { height: 5, backgroundColor: ref.blue },
  dropdownScroll: { maxHeight: 360 },
  optionRow: { paddingHorizontal: 22, paddingVertical: 20 },
  optionText: { fontSize: 18, color: ref.text, fontWeight: '400' },
  optionTextActive: { color: ref.blue, fontWeight: '600' },
});
