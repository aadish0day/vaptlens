import React from 'react';
import { AvatarGroup } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

export const Overflow = () => <div style={APP}><AvatarGroup names={['Priya Raman', 'Tom Okafor', 'Lena Vogt', 'Sam Ito', 'Ana Ruiz', 'Kofi Mensah']} max={4} /></div>;

export const Small = () => <div style={APP}><AvatarGroup names={['Priya Raman', 'Tom Okafor', 'Lena Vogt']} size={22} /></div>;
