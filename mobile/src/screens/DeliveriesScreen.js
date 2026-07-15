import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Package, Plus, RefreshCw } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const formatDate = (value) => value ? new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

export default function DeliveriesScreen({ navigation, route }) {
  const { user } = useAuth();
  const siteId = route?.params?.siteId || user?.project_id || user?.site_id;
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!siteId) return;
    try { setDeliveries((await api.get('/deliveries', { params: { site_id: siteId } })).data || []); }
    finally { setLoading(false); }
  }, [siteId]);
  useEffect(() => { load(); }, [load]);
  return <SafeAreaView style={s.page} edges={['top']}>
    <View style={s.header}><TouchableOpacity onPress={() => navigation.goBack()}><ArrowLeft size={23} color="#111827" /></TouchableOpacity><Package size={21} color="#2b4594" /><Text style={s.title}>Deliveries</Text><TouchableOpacity onPress={load}><RefreshCw size={19} color="#64748b" /></TouchableOpacity></View>
    {loading ? <View style={s.center}><ActivityIndicator size="large" color="#2b4594" /></View> : <FlatList
      data={deliveries} keyExtractor={(item) => String(item._id || item.id)} refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
      contentContainerStyle={deliveries.length ? s.list : s.empty}
      ListEmptyComponent={<><Package size={42} color="#cbd5e1" /><Text style={s.emptyTitle}>No deliveries recorded</Text><Text style={s.emptyCopy}>Add the first delivery for this site.</Text></>}
      renderItem={({ item }) => <View style={s.card}><View style={s.icon}><Package size={20} color="#c2410c" /></View><View style={s.meta}><Text style={s.name}>{item.itemName || item.recipient || 'Delivery'}</Text><Text style={s.sub}>For {item.recipient || 'site reception'}{item.company ? ` · ${item.company}` : ''}</Text><Text style={s.date}>{formatDate(item.receivedAt || item.createdAt)}</Text></View><Text style={[s.status, item.collected && s.collected]}>{item.collected ? 'Collected' : 'Awaiting collection'}</Text></View>}
    />}
    <TouchableOpacity style={s.add} onPress={() => navigation.navigate('DeliveryForm', { siteId })}><Plus size={20} color="#fff" /><Text style={s.addText}>Add Delivery</Text></TouchableOpacity>
  </SafeAreaView>;
}
const s = StyleSheet.create({ page:{flex:1,backgroundColor:'#f8fafc'}, header:{flexDirection:'row',alignItems:'center',gap:12,padding:18,backgroundColor:'#fff',borderBottomWidth:1,borderColor:'#e5e7eb'},title:{flex:1,fontSize:19,fontWeight:'800',color:'#111827'},center:{flex:1,alignItems:'center',justifyContent:'center'},list:{padding:16,paddingBottom:100},empty:{flexGrow:1,alignItems:'center',justifyContent:'center',padding:28},emptyTitle:{marginTop:14,fontSize:17,fontWeight:'700',color:'#334155'},emptyCopy:{marginTop:6,fontSize:14,color:'#64748b',textAlign:'center'},card:{flexDirection:'row',alignItems:'center',gap:12,backgroundColor:'#fff',borderRadius:14,padding:14,marginBottom:10,borderWidth:1,borderColor:'#e5e7eb'},icon:{width:42,height:42,borderRadius:12,backgroundColor:'#fff7ed',alignItems:'center',justifyContent:'center'},meta:{flex:1},name:{fontSize:15,fontWeight:'700',color:'#111827'},sub:{fontSize:13,color:'#475569',marginTop:2},date:{fontSize:12,color:'#94a3b8',marginTop:4},status:{fontSize:11,fontWeight:'700',color:'#b45309',maxWidth:74,textAlign:'right'},collected:{color:'#15803d'},add:{position:'absolute',right:20,bottom:24,flexDirection:'row',alignItems:'center',gap:8,backgroundColor:'#2b4594',borderRadius:28,paddingHorizontal:18,paddingVertical:14,elevation:4},addText:{color:'#fff',fontWeight:'800',fontSize:15} });
