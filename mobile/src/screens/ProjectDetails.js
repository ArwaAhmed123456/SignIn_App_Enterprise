import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Clock, User, Briefcase, Car, FileText, Download, Search, Users } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import api from '../services/api';
import { styled } from 'nativewind';

const StyledView = styled(View);
const StyledText = styled(Text);
const StyledTouchableOpacity = styled(TouchableOpacity);
const StyledScrollView = styled(ScrollView);
const StyledTextInput = styled(TextInput);

const ProjectDetails = ({ route, navigation }) => {
    const { project } = route.params;
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            const res = await api.get(`/logs?project_code=${project.code}`);
            setLogs(res.data);
        } catch (err) {
            console.error('Failed to fetch logs', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDateUK = (dateStr) => {
        if (!dateStr) return '-';
        const parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        return `${parts[2]}/${parts[1]}/${parts[0]}`;
    };

    const getDayName = (dateStr) => {
        const date = new Date(dateStr);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[date.getDay()];
    };

    const getHrsMins = (decimalHours) => {
        if (!decimalHours) return { hrs: 0, mins: 0 };
        const hrs = Math.floor(decimalHours);
        const mins = Math.round((decimalHours - hrs) * 60);
        return { hrs, mins };
    };

    // Filtered and grouped logs
    const memoizedData = useMemo(() => {
        const filtered = logs.filter(log =>
            log.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (log.trade && log.trade.toLowerCase().includes(searchQuery.toLowerCase()))
        );

        const activeCount = logs.filter(l => !l.time_out).length;

        // Grouping by date
        const groups = {};
        filtered.forEach(log => {
            if (!groups[log.date]) {
                groups[log.date] = [];
            }
            groups[log.date].push(log);
        });

        // Sort within groups: active workers at top
        Object.keys(groups).forEach(date => {
            groups[date].sort((a, b) => {
                if (!a.time_out && b.time_out) return -1;
                if (a.time_out && !b.time_out) return 1;
                return 0;
            });
        });

        // Sort groups by date descending
        const sortedDates = Object.keys(groups).sort((a, b) => new Date(b) - new Date(a));

        return { groups, sortedDates, activeCount };
    }, [logs, searchQuery]);

    const { groups, sortedDates, activeCount } = memoizedData;

    const exportPDF = async () => {
        if (logs.length === 0) {
            Alert.alert("No Data", "There are no logs to export for this project.");
            return;
        }

        setExporting(true);
        try {
            const tableRows = logs.map(log => {
                const { hrs, mins } = getHrsMins(log.hours);
                return `
                    <tr>
                        <td style="border: 1px solid #ddd; padding: 8px;">${formatDateUK(log.date)}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${log.name}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${log.trade || '-'}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${log.car_reg || '-'}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${log.user_type || 'Employee'}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${log.time_in}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${log.time_out || 'Active'}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${log.time_out ? hrs : '-'}</td>
                        <td style="border: 1px solid #ddd; padding: 8px;">${log.time_out ? mins : '-'}</td>
                    </tr>
                `;
            }).join('');

            const htmlContent = `
                <html>
                    <head>
                        <style>
                            body { font-family: 'Helvetica', 'Arial', sans-serif; padding: 20px; }
                            h1 { color: #1e293b; margin-bottom: 5px; }
                            p { color: #64748b; margin-top: 0; margin-bottom: 20px; }
                            table { width: 100%; border-collapse: collapse; font-size: 10px; }
                            th { background-color: #f1f5f9; color: #475569; border: 1px solid #ddd; padding: 8px; text-align: left; text-transform: uppercase; }
                        </style>
                    </head>
                    <body>
                        <h1>${project.name}</h1>
                        <p>Project Code: ${project.code} | Generated: ${new Date().toLocaleDateString('en-GB')}</p>
                        <table>
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Name</th>
                                    <th>Company</th>
                                    <th>Car Reg</th>
                                    <th>Type</th>
                                    <th>In</th>
                                    <th>Out</th>
                                    <th>Hrs</th>
                                    <th>Mins</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${tableRows}
                            </tbody>
                        </table>
                    </body>
                </html>
            `;

            const { uri } = await Print.printToFileAsync({ html: htmlContent });
            await Sharing.shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
        } catch (error) {
            console.error('PDF Export Error:', error);
            Alert.alert("Export Failed", "Could not generate or share the PDF report.");
        } finally {
            setExporting(false);
        }
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
            {/* Header */}
            <StyledView className="bg-white px-4 py-4 border-b border-gray-100 flex-row items-center justify-between shadow-sm">
                <StyledView className="flex-row items-center flex-1">
                    <StyledTouchableOpacity onPress={() => navigation.goBack()} className="p-2 mr-2 bg-slate-50 rounded-full">
                        <ArrowLeft size={20} color="#475569" />
                    </StyledTouchableOpacity>
                    <StyledView className="flex-1">
                        <StyledText className="text-lg font-bold text-gray-900" numberOfLines={1}>{project.name}</StyledText>
                        <StyledText className="text-[10px] font-mono text-primary uppercase tracking-widest">{project.code}</StyledText>
                    </StyledView>
                </StyledView>

                <StyledTouchableOpacity
                    onPress={exportPDF}
                    disabled={exporting}
                    className="bg-primary p-3 rounded-xl ml-2 flex-row items-center shadow-lg"
                >
                    {exporting ? (
                        <ActivityIndicator size="small" color="#ffffff" />
                    ) : (
                        <>
                            <Download size={16} color="#ffffff" />
                            <StyledText className="text-white text-xs font-bold ml-1">Export PDF</StyledText>
                        </>
                    )}
                </StyledTouchableOpacity>
            </StyledView>

            {loading ? (
                <StyledView className="flex-1 items-center justify-center">
                    <ActivityIndicator size="large" color="#2b4594" />
                    <StyledText className="mt-4 text-slate-400 font-medium">Loading project data...</StyledText>
                </StyledView>
            ) : (
                <StyledScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>

                    {/* Active Workers Stats */}
                    <StyledView className="bg-primary rounded-3xl p-5 mb-6 flex-row items-center shadow-lg shadow-primary/30">
                        <StyledView className="bg-white/20 p-3 rounded-2xl mr-4">
                            <Users size={28} color="#ffffff" />
                        </StyledView>
                        <StyledView>
                            <StyledText className="text-white/80 font-medium text-xs mb-1 uppercase tracking-wider">Workers on Site</StyledText>
                            <StyledText className="text-white text-3xl font-black">{activeCount}</StyledText>
                        </StyledView>
                        <StyledView className="ml-auto bg-white/10 px-3 py-1 rounded-lg">
                            <StyledText className="text-white text-[10px] font-bold">LIVE NOW</StyledText>
                        </StyledView>
                    </StyledView>

                    {/* Search Bar */}
                    <StyledView className="flex-row items-center bg-white border border-slate-100 rounded-2xl px-4 py-3 mb-6 shadow-sm">
                        <Search size={18} color="#94a3b8" />
                        <StyledTextInput
                            placeholder="Search by name or company..."
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                            className="flex-1 ml-3 text-slate-600 font-medium"
                            placeholderTextColor="#94a3b8"
                        />
                    </StyledView>

                    <StyledView className="flex-row items-center mb-4">
                        <FileText size={18} color="#475569" />
                        <StyledText className="text-sm font-bold text-slate-800 ml-2">Recent Attendance</StyledText>
                    </StyledView>

                    {sortedDates.length === 0 ? (
                        <StyledView className="bg-white p-10 rounded-2xl items-center border border-dashed border-slate-200">
                            <StyledText className="text-slate-400 font-medium text-center">
                                {searchQuery ? 'No results found for your search.' : 'No logs recorded for this project yet.'}
                            </StyledText>
                        </StyledView>
                    ) : (
                        sortedDates.map(date => (
                            <StyledView key={date} className="mb-6">
                                {/* Date Header */}
                                <StyledView className="flex-row items-center mb-3 bg-slate-50/50 p-2 rounded-lg">
                                    <StyledView className="w-1 h-4 bg-primary rounded-full mr-2" />
                                    <StyledText className="text-slate-900 font-black text-sm uppercase">
                                        {getDayName(date)} {formatDateUK(date)}
                                    </StyledText>
                                    <StyledView className="ml-2 bg-slate-200 h-[1px] flex-1" />
                                </StyledView>

                                {groups[date].map(log => (
                                    <StyledView key={log.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 mb-3">
                                        <StyledView className="flex-row justify-between items-center mb-3">
                                            <StyledView className="flex-row items-center flex-1">
                                                <StyledView className="bg-slate-50 p-2 rounded-xl border border-slate-100 mr-3">
                                                    <User size={18} color={!log.time_out ? "#2b4594" : "#64748b"} />
                                                </StyledView>
                                                <StyledView className="flex-1">
                                                    <StyledText className="font-bold text-slate-900 text-base" numberOfLines={1}>{log.name}</StyledText>
                                                    <StyledView className="flex-row items-center">
                                                        <Briefcase size={12} color="#94a3b8" />
                                                        <StyledText className="text-xs text-slate-500 ml-1">{log.trade || 'Worker'}</StyledText>
                                                    </StyledView>
                                                </StyledView>
                                            </StyledView>
                                            <StyledView className={`px-2 py-1 rounded-lg border ${!log.time_out ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                                                <StyledText className={`text-[9px] font-black uppercase tracking-tighter ${!log.time_out ? 'text-green-600' : 'text-slate-400'}`}>
                                                    {!log.time_out ? 'ON SITE' : 'SIGNED OFF'}
                                                </StyledText>
                                            </StyledView>
                                        </StyledView>

                                        <StyledView className="flex-row items-center justify-between pt-3 border-t border-slate-50">
                                            <StyledView className="flex-row items-center card-info-box">
                                                <Clock size={14} color="#64748b" />
                                                <StyledText className="text-xs text-slate-600 ml-1 font-bold">
                                                    {log.time_in} {log.time_out ? `- ${log.time_out}` : ''}
                                                </StyledText>
                                            </StyledView>
                                            <StyledView className="flex-row items-center">
                                                <Car size={14} color="#64748b" />
                                                <StyledText className="text-xs text-slate-600 ml-1 font-bold">{log.car_reg || 'N/A'}</StyledText>
                                            </StyledView>
                                        </StyledView>
                                    </StyledView>
                                ))}
                            </StyledView>
                        ))
                    )}
                    <StyledView className="h-24" />
                </StyledScrollView>
            )}
        </SafeAreaView>
    );
};

export default ProjectDetails;
