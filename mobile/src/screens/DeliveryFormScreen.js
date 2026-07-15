import React, { useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Package } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const DeliveryFormScreen = ({ navigation }) => {
  const { user } = useAuth();
  const [itemName, setItemName] = useState('');
  const [description, setDescription] = useState('');
  const [carRegistration, setCarRegistration] = useState('');
  const [company, setCompany] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!itemName.trim() || !company.trim()) {
      Alert.alert('Required fields', 'Please enter the item name and company.');
      return;
    }
    setSaving(true);
    try {
      await api.post('/deliveries', {
        site_id: user?.project_id || user?.site_id,
        item_name: itemName.trim(), description: description.trim(),
        car_registration: carRegistration.trim(), company: company.trim(),
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
      <TouchableOpacity onPress={save} style={s.button} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Record delivery</Text>}</TouchableOpacity>
    </ScrollView>
  </SafeAreaView>;
};
const s = StyleSheet.create({ container:{flex:1,backgroundColor:'#f9fafb'}, header:{flexDirection:'row',alignItems:'center',gap:12,padding:18,backgroundColor:'#fff',borderBottomWidth:1,borderColor:'#e5e7eb'}, title:{fontSize:18,fontWeight:'700',color:'#111827'}, form:{padding:20}, intro:{fontSize:14,color:'#6b7280',marginBottom:22}, label:{fontSize:14,fontWeight:'600',color:'#374151',marginBottom:7}, input:{backgroundColor:'#fff',borderWidth:1,borderColor:'#e5e7eb',borderRadius:12,padding:13,fontSize:15,marginBottom:16}, description:{minHeight:90,textAlignVertical:'top'}, button:{backgroundColor:'#2b4594',padding:16,borderRadius:14,alignItems:'center',marginTop:8}, buttonText:{color:'#fff',fontSize:16,fontWeight:'700'} });
export default DeliveryFormScreen;
