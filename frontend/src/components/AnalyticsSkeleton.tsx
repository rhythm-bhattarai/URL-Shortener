import React from 'react';
import { Card, Skeleton, Row, Col } from 'antd';
import { LineChartOutlined } from '@ant-design/icons';

export const AnalyticsSkeleton: React.FC = () => {
  return (
    <Card 
      title={<><LineChartOutlined /> Analytics Dashboard</>} 
      style={{ marginTop: '24px', borderRadius: '12px' }}
      bordered={false}
    >
      <Row gutter={[16, 16]}>
        <Col span={8}>
          <Card size="small" style={{ backgroundColor: '#fafafa' }}>
             <Skeleton active paragraph={{ rows: 1 }} title={false} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ backgroundColor: '#fafafa' }}>
             <Skeleton active paragraph={{ rows: 1 }} title={false} />
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ backgroundColor: '#fafafa' }}>
             <Skeleton active paragraph={{ rows: 1 }} title={false} />
          </Card>
        </Col>
      </Row>
      <div style={{ marginTop: '24px' }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    </Card>
  );
};