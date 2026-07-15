import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ArrowLeft, Calendar, Clock, Package } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DeliveryFormScreen = ({ navigation, route }) => {
  const { user } = useAuth();
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [carRegistration, setCarRegistration] = useState('');
  const [company, setCompany] = useState('');
  const [receivedAt, setReceivedAt] = useState(new Date());
  const [pickerMode, setPickerMode] = useState(null);
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!itemName.trim() || !company.trim()) {
      Alert.alert('Required fields', 'Please enter the item name and company.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/deliveries', {
        site_id: route?.params?.siteId || user?.project_id || user?.site_id,
        item_name: itemName.trim(), description: description.trim(),
        car_registration: carRegistration.trim(), company: company.trim(),
        received_at: receivedAt.toISOString(),
      });
      Alert.alert('Delivery recorded', 'The delivery has been recorded successfully.', [{ text: 'Done', onPress: () => navigation.goBack() }]);
    } catch (error) {
      Alert.alert('Could not record delivery', error?.response?.data?.error || 'Please try again.');
    } finally { setSaving(false); }
  };

  return <SafeAreaView style={s.container} edges={['top']}>
    <View style={s.header}><TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={24} color="#111827" /></TouchableOpacity><Package size={22} color="#2b4594" /><Text style={s.title}>Record delivery</Text></View>
    <ScrollView contentContainerStyle={s.form}>
      <Text style={s.intro}>Record delivery details for this site.</Text>
      <Text style={s.label}>Item name</Text><TextInput value={itemName} onChangeText={setItemName} style={s.input} placeholder="Item name" />
      <Text style={s.label}>Description</Text><TextInput value={description} onChangeText={setDescription} style={[s.input, s.description]} placeholder="Item description" multiline />
      <Text style={s.label}>Car registration number</Text><TextInput value={carRegistration} onChangeText={setCarRegistration} style={s.input} placeholder="Car registration number" autoCapitalize="characters" />
      <Text style={s.label}>Company</Text><TextInput value={company} onChangeText={setCompany} style={s.input} placeholder="Company name" />
      <Text style={s.label}>Delivery Date and Time</Text>
      <View style={s.dateRow}>
        <TouchableOpacity onPress={() => setPickerMode('date')} style={s.dateBtn}><Calendar size={18} color="#2b4594" /><Text style={s.dateBtnLabel}>Date</Text><Text style={s.dateBtnValue}>{receivedAt.toLocaleDateString('en-GB')}</Text></TouchableOpacity>
        <TouchableOpacity onPress={() => setPickerMode('time')} style={s.dateBtn}><Clock size={18} color="#2b4594" /><Text style={s.dateBtnLabel}>Time</Text><Text style={s.dateBtnValue}>{receivedAt.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</Text></TouchableOpacity>
      </View>
      {pickerMode ? <DateTimePicker value={receivedAt} mode={pickerMode} is24Hour display="default" onChange={(event, value) => { setPickerMode(null); if (value) setReceivedAt(value); }} /> : null}
      <TouchableOpacity onPress={save} style={s.button} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Record delivery</Text>}</TouchableOpacity>
    </ScrollView>
  </SafeAreaView>;
};
const s = StyleSheet.create({ container:{flex:1,backgroundColor:'#f9fafb'}, header:{flexDirection:'row',alignItems:'center',gap:12,padding:18,backgroundColor:'#fff',borderBottomWidth:1,borderColor:'#e5e7eb'}, title:{fontSize:18,fontWeight:'700',color:'#111827'}, form:{padding:20}, intro:{fontSize:14,color:'#6b7280',marginBottom:22}, label:{fontSize:14,fontWeight:'600',color:'#374151',marginBottom:7}, input:{backgroundColor:'#fff',borderWidth:1,borderColor:'#e5e7eb',borderRadius:12,padding:13,fontSize:15,marginBottom:16}, description:{minHeight:90,textAlignVertical:'top'}, dateRow:{flexDirection:'row',gap:10,marginBottom:16},dateBtn:{flex:1,backgroundColor:'#fff',borderWidth:1,borderColor:'#cbd5e1',borderRadius:12,padding:12},dateBtnLabel:{fontSize:12,color:'#2b4594',fontWeight:'700',marginTop:6,marginBottom:4},dateBtnValue:{fontSize:15,fontWeight:'700',color:'#111827'}, button:{backgroundColor:'#2b4594',padding:16,borderRadius:14,alignItems:'center',marginTop:8}, buttonText:{color:'#fff',fontSize:16,fontWeight:'700'} });
export default DeliveryFormScreen;
