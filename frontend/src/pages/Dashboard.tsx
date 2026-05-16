import React from 'react';
import { Layout, Typography } from 'antd';
import { ShortenerForm } from '../components/ShortenerForm'
import { AnalyticsSkeleton } from '../components/AnalyticsSkeleton';

const { Header, Content } = Layout;
const { Title } = Typography;

export const Dashboard: React.FC = () => {
  return (
    <Layout style={{ minHeight: '100vh', backgroundColor: '#f0f2f5' }}>
      <Header style={{ backgroundColor: '#fff', display: 'flex', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
        <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
          URL Shortener
        </Title>
      </Header>
      
      <Content style={{ padding: '40px 20px', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        {/* Core Input Component */}
        <ShortenerForm />
        
        {/* Analytics Placeholder Component */}
        <AnalyticsSkeleton />
      </Content>
    </Layout>
  );
};