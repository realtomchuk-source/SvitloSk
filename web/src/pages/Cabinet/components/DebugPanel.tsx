import React from 'react';
import { useStore } from '../../../store/useStore';

export const DebugPanel: React.FC = () => {
    const { user } = useStore();
    const [lastEvent, setLastEvent] = React.useState<string>('NONE');

    React.useEffect(() => {
        const ev = localStorage.getItem('sssk_last_auth_event');
        if (ev) setLastEvent(ev);
    }, []);

    return (
        <div style={{ 
            padding: '12px', 
            background: '#f4f4f5', 
            borderRadius: '12px', 
            fontSize: '11px', 
            marginTop: '32px', 
            color: '#71717a',
            border: '1px dashed #e4e4e7',
            textAlign: 'left',
            fontFamily: 'monospace',
            wordBreak: 'break-all'
        }}>
            <div style={{ fontWeight: 'bold', marginBottom: '8px', color: '#1a1a1c' }}>🛠 DIAGNOSTIC PANEL:</div>
            <div>URL: {window.location.href}</div>
            <div style={{ marginTop: '4px' }}>SEARCH PARAMS: {window.location.search || 'EMPTY'}</div>
            <div style={{ marginTop: '4px' }}>USER: {user ? `${user.email} (${user.id.substring(0,8)}...)` : 'GUEST / NULL'}</div>
            <div style={{ marginTop: '4px' }}>LAST EVENT: {lastEvent}</div>
            <div style={{ marginTop: '8px', fontSize: '9px', color: '#a1a1aa' }}>
                If SEARCH PARAMS is EMPTY after redirect, the browser is stripping the auth code.
            </div>
        </div>
    );
};
