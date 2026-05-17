import React, { useState, useEffect, useRef } from 'react';
import { Card, Spin, Empty, Button, Tooltip } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { ApiService } from '../services/ApiService';
import { type AnalyticsResponse } from '../types/Types';
import Chart from 'chart.js/auto';

interface AnalyticsPageProps {
  shortUrlCode: string;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({ shortUrlCode }) => {
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  
  // Guard ref to prevent React StrictMode or re-renders from double-firing on mount
  const hasFetched = useRef(false);

  // 1. Core Fetch Logic
  const fetchAnalytics = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      console.log(`Sending API request for code: ${shortUrlCode}`); // Track requests in your browser console
      const response = await ApiService.getAnalytics(shortUrlCode);
      setData(response);
    } catch (err) {
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 2. STABLE INITIAL FETCH (Fires exactly once per code change)
  useEffect(() => {
    hasFetched.current = false; // Reset for new codes
    
    if (!hasFetched.current) {
      fetchAnalytics(false);
      hasFetched.current = true;
    }
  }, [shortUrlCode]); 

  // 3. Chart.js Engine Handler
  useEffect(() => {
    if (!data || !canvasRef.current) return;

    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.timeline.map((item) => item.date),
        datasets: [{
          label: 'Total Clicks',
          data: data.timeline.map((item) => item.count),
          borderColor: '#1890ff',
          backgroundColor: 'rgba(24, 144, 255, 0.2)',
          fill: true,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [data]);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <Spin size="large" description="Loading metrics..." />
      </div>
    );
  }

  if (!data) {
    return <Empty description="Could not load analytics for this link." />;
  }

  return (
    <Card 
      title={`Tracking Insight: ${shortUrlCode}`}
      style={{ marginTop: '24px', borderRadius: '8px' }}
      extra={
        <Tooltip title="Refresh stats">
          <Button 
            type="primary" 
            icon={<ReloadOutlined spin={refreshing} />} 
            onClick={() => fetchAnalytics(true)} // Explicit user trigger
            disabled={refreshing}
          >
            Refresh
          </Button>
        </Tooltip>
      }
    >
      <div style={{ marginBottom: '30px', padding: '16px', backgroundColor: '#fafafa', borderRadius: '8px' }}>
        <div style={{ fontSize: '16px', marginBottom: '8px' }}>
          <strong>Total Clicks: </strong> 
          <span style={{ color: '#1890ff', fontSize: '18px' }}>{data.total_clicks}</span>
        </div>
        <div style={{ fontSize: '14px' }}>
          <strong>Destination: </strong> 
          <a href={data.original_url} target="_blank" rel="noreferrer">{data.original_url}</a>
        </div>
      </div>

      <div style={{ height: '300px', width: '100%' }}>
        <canvas ref={canvasRef}></canvas>
      </div>
    </Card>
  );
};