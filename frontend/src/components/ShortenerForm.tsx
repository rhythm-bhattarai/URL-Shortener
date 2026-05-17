import React, { useState, useEffect } from 'react';
import { Input, Button, Card, Typography, Alert } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiService } from '../services/ApiService';
import { type URLRecord } from '../types/Types';

const { Title } = Typography;

interface ShortenerFormProps {
  onLinkCreated: (newLink: URLRecord) => void;
}

export const ShortenerForm: React.FC<ShortenerFormProps> = ({ onLinkCreated }) => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState<number>(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async () => {
    if (!url || cooldown > 0) return;
    setLoading(true);
    setError(null);

    try {
      const data = await ApiService.shortenUrl({ original_url: url });
      onLinkCreated(data);
      setUrl(''); 
    } catch (err: any) {
      const errorMsg = err.message || "Something went wrong";
      const timeMatch = errorMsg.match(/after (\d+) seconds/);
      if (timeMatch) {
        setCooldown(parseInt(timeMatch[1], 10));
        setError(`Rate limit exceeded. Cooling down...`);
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card bordered={false} style={{ borderRadius: '12px', marginBottom: '24px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      <Title level={4} style={{ marginTop: 0 }}>Create New Link</Title>
      <div style={{ display: 'flex', gap: '8px' }}>
        <Input 
          size="large" 
          placeholder="Paste your long URL here..." 
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onPressEnter={handleSubmit}
          prefix={<LinkOutlined style={{ color: '#bfbfbf' }} />}
          disabled={loading || cooldown > 0}
        />
        <Button type="primary" size="large" onClick={handleSubmit} loading={loading} disabled={!url || cooldown > 0}>
          {cooldown > 0 ? `Wait ${cooldown}s` : 'Shorten'}
        </Button>
      </div>
      <AnimatePresence mode="wait">
        {error && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginTop: '16px', overflow: 'hidden' }}>
            <Alert message={error} type="error" showIcon />
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};