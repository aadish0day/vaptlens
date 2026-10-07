import React from 'react';
import { Pagination } from 'vaptlens';

// app root: the DS ships no body font, so set it the way an app would
const APP = { fontFamily: 'var(--font-sans)', color: 'var(--ink)' };

export const Middle = () => <div style={APP}><Pagination total={212} page={4} pageSize={25} onChange={() => {}} /></div>;

export const WithPageSize = () => <div style={APP}><Pagination total={212} page={1} pageSize={25} onChange={() => {}} onPageSizeChange={() => {}} /></div>;
