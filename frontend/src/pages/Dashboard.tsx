import React, { useState, useEffect } from 'react';
import { Layout, Typography, Table, Button, Card, Spin } from 'antd';
import { BarChartOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { ShortenerForm } from '../components/ShortenerForm';
import { AnalyticsPage } from '../components/AnalyticsPage';
import { ApiService } from '../services/ApiService';
import { type URLRecord } from '../types/Types';

const { Header, Content } = Layout;
const { Title, Link } = Typography;

export const Dashboard: React.FC = () => {
  const [links, setLinks] = useState<URLRecord[]>([]);
  const [tableLoading, setTableLoading] = useState(true);
  const [selectedAnalyticsKey, setSelectedAnalyticsKey] = useState<string | null>(null);

  // 1. Initial Load: Pull historical URL items directly from database models
  useEffect(() => {
    const loadInitialRecords = async () => {
      try {
        const records = await ApiService.listUrls();
        setLinks(records);
      } catch (err) {
        console.error("Failed to load link dashboard historical array:", err);
      } finally {
        setTableLoading(false);
      }
    };
    loadInitialRecords();
  }, []);

  const handleNewLink = (newLink: URLRecord) => {
    const structuredLink = { ...newLink, clicks: newLink.clicks ?? 0 };
    setLinks((prevLinks) => [structuredLink, ...prevLinks]);
  };

  const handleShortLinkClick = async (e: React.MouseEvent, record: URLRecord) => {
    e.preventDefault();
    
    // Open destination location in a separate viewport tab immediately
    window.open(record.original_url, '_blank', 'noopener,noreferrer');

    // Optimistic UI Update: Tick counter up by 1 instantly for slick UX
    setLinks((prevLinks) =>
      prevLinks.map((link) =>
        link.short_url === record.short_url ? { ...link, clicks: (link.clicks ?? 0) + 1 } : link
      )
    );

    try {
      // Synchronize exact click total count served directly from backend DB execution
      const trackingData = await ApiService.trackClick(record.short_url);
      setLinks((prevLinks) =>
        prevLinks.map((link) =>
          link.short_url === record.short_url ? { ...link, clicks: trackingData.clicks } : link
        )
      );
    } catch (err) {
      console.error("Error sync tracking clicks sync hook:", err);
    }
  };

  const toggleAnalytics = (shortUrlCode: string) => {
    setSelectedAnalyticsKey(selectedAnalyticsKey === shortUrlCode ? null : shortUrlCode);
  };

  const columns = [
    {
      title: 'Original URL',
      dataIndex: 'original_url',
      key: 'original_url',
      ellipsis: true,
      render: (text: string) => <span style={{ color: '#595959' }}>{text}</span>
    },
    {
      title: 'Short URL',
      dataIndex: 'short_url',
      key: 'short_url',
      render: (shortCode: string, record: URLRecord) => (
        <Link href={record.original_url} onClick={(e) => handleShortLinkClick(e, record)} style={{ fontWeight: 600 }}>
          {shortCode}
        </Link>
      )
    },
    {
      title: 'Total No. of Clicks',
      dataIndex: 'clicks',
      key: 'clicks',
      width: 160,
      render: (count: number) => <strong style={{ color: '#1890ff' }}>{count}</strong>
    },
    {
      title: 'Action',
      key: 'action',
      width: 150,
      render: (_: any, record: URLRecord) => (
        <Button 
          type={selectedAnalyticsKey === record.short_url ? "primary" : "default"}
          icon={<BarChartOutlined />}
          size="small"
          onClick={() => toggleAnalytics(record.short_url)}
        >
          {selectedAnalyticsKey === record.short_url ? "Hide Stats" : "Analytics"}
        </Button>
      )
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Header style={{ backgroundColor: '#fff', display: 'flex', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Title level={3} style={{ margin: 0, color: '#1890ff' }}>URL Workspace Dashboard</Title>
      </Header>
      
      <Content style={{ padding: '40px 20px', maxWidth: '900px', margin: '0 auto', width: '100%' }}>
        <ShortenerForm onLinkCreated={handleNewLink} />
        
        <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
          <Spin spinning={tableLoading} tip="Loading workspace link records...">
            <Table dataSource={links} columns={columns} rowKey="short_url" pagination={{ pageSize: 5 }} />
          </Spin>
        </Card>

        <AnimatePresence mode="wait">
          {selectedAnalyticsKey && (
            <motion.div
              key={selectedAnalyticsKey}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.2 }}
            >
              <AnalyticsPage shortUrlCode={selectedAnalyticsKey} />
            </motion.div>
          )}
        </AnimatePresence>
      </Content>
    </Layout>
  );
};