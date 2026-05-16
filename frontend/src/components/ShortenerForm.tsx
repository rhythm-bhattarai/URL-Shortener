import React, { useState, useEffect } from 'react';
import { Input, Button, Card, Typography, Alert, Tooltip } from 'antd';
import { LinkOutlined, CopyOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import { ApiService } from '../services/ApiService'; // Adjust path if needed
import { type URLRecord } from '../types/Types'; // Adjust path if needed

const { Title, Text } = Typography;

export const ShortenerForm: React.FC = () => {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<URLRecord | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Cooldown timer state for handling 429 elegantly
  const [cooldown, setCooldown] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  // Countdown Hook
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSubmit = async () => {
    if (!url || cooldown > 0) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setCopied(false);

    try {
      const data = await ApiService.shortenUrl({ original_url: url });
      setResult(data);
      setUrl(''); // Clear input on success
    } catch (err: any) {
      const errorMsg = err.message || "Something went wrong";
      
      // Parse the custom 429 error message we created in ApiService
      // "Rate limit exceeded. Please try again after 42 seconds."
      const timeMatch = errorMsg.match(/after (\d+) seconds/);
      
      if (timeMatch) {
        const seconds = parseInt(timeMatch[1], 10);
        // Only update cooldown if it's not already counting down to avoid visual flickering
        if (cooldown === 0) setCooldown(seconds);
        setError(`Rate limit exceeded. Cooling down...`);
      } else {
        setError(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      const fullUrl = `${import.meta.env.VITE_API_BASE_URL}/${result.short_url}`;
      navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card bordered={false} style={{ borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
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
        <Button 
          type="primary" 
          size="large" 
          onClick={handleSubmit} 
          loading={loading}
          disabled={!url || cooldown > 0}
        >
          {cooldown > 0 ? `Wait ${cooldown}s` : 'Shorten'}
        </Button>
      </div>

      <AnimatePresence mode="wait">
        {/* Error State Animation */}
        {error && (
          <motion.div 
            key="error"
            initial={{ opacity: 0, y: -10, height: 0 }} 
            animate={{ opacity: 1, y: 0, height: 'auto' }} 
            exit={{ opacity: 0, y: -10, height: 0 }}
            style={{ marginTop: '16px', overflow: 'hidden' }}
          >
            <Alert 
              message={error} 
              description={cooldown > 0 ? `Please wait ${cooldown} seconds before creating another link.` : undefined}
              type="error" 
              showIcon 
            />
          </motion.div>
        )}

        {/* Success Result Animation */}
        {result && (
          <motion.div 
            key="result"
            initial={{ opacity: 0, y: 10, height: 0 }} 
            animate={{ opacity: 1, y: 0, height: 'auto' }} 
            exit={{ opacity: 0, y: 10, height: 0 }}
            style={{ marginTop: '16px', overflow: 'hidden' }}
          >
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f6ffed', 
              border: '1px solid #b7eb8f',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <Text type="secondary" style={{ display: 'block', fontSize: '12px' }}>Your shortened URL is ready:</Text>
                <Text strong style={{ fontSize: '16px', color: '#389e0d' }}>
                  {import.meta.env.VITE_API_BASE_URL}/{result.short_url}
                </Text>
              </div>
              <Tooltip title={copied ? "Copied!" : "Copy to clipboard"}>
                <Button 
                  icon={copied ? <CheckCircleOutlined style={{ color: '#52c41a' }}/> : <CopyOutlined />} 
                  onClick={handleCopy}
                  type="text"
                />
              </Tooltip>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
};