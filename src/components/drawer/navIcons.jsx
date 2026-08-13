import React from 'react';
import Svg, { Path, Rect, Circle, Line } from 'react-native-svg';

// Small line-icon set for the sidebar nav — one file so SidebarContent stays
// readable. `color` is passed per-item (active vs inactive tint).
export const NavIcons = {
  dashboard: (color) => (
    <Svg width={15} height={15} viewBox="0 0 16 16">
      <Rect x={1.5} y={1.5} width={5.5} height={5.5} fill={color} />
      <Rect x={9} y={1.5} width={5.5} height={5.5} fill={color} opacity={0.5} />
      <Rect x={1.5} y={9} width={5.5} height={5.5} fill={color} opacity={0.5} />
      <Rect x={9} y={9} width={5.5} height={5.5} fill={color} opacity={0.5} />
    </Svg>
  ),
  billing: (color) => (
    <Svg width={15} height={15} viewBox="0 0 16 16">
      <Path d="M2 13V3h7l5 5v5z" fill="none" stroke={color} strokeWidth={1.3} />
    </Svg>
  ),
  products: (color) => (
    <Svg width={15} height={15} viewBox="0 0 16 16">
      <Path d="M2 6l6-4 6 4-6 4-6-4z" fill="none" stroke={color} strokeWidth={1.3} />
      <Path d="M2 6v6l6 4 6-4V6" fill="none" stroke={color} strokeWidth={1.3} />
    </Svg>
  ),
  creditCustomers: (color) => (
    <Svg width={15} height={15} viewBox="0 0 16 16">
      <Circle cx={8} cy={5} r={2.5} fill="none" stroke={color} strokeWidth={1.3} />
      <Path d="M3 14c0-2.8 2.2-5 5-5s5 2.2 5 5" fill="none" stroke={color} strokeWidth={1.3} />
    </Svg>
  ),
  reports: (color) => (
    <Svg width={15} height={15} viewBox="0 0 16 16">
      <Path d="M2 14V2M2 14h12" stroke={color} strokeWidth={1.3} />
      <Path d="M4 11l3-4 2 2 4-5" fill="none" stroke={color} strokeWidth={1.3} />
    </Svg>
  ),
  shops: (color) => (
    <Svg width={15} height={15} viewBox="0 0 16 16">
      <Rect x={2} y={2} width={12} height={12} rx={2} fill="none" stroke={color} strokeWidth={1.3} />
    </Svg>
  ),
  notifications: (color) => (
    <Svg width={15} height={15} viewBox="0 0 16 16">
      <Path d="M8 2a4 4 0 0 0-4 4v2.5c0 .8-.3 1.6-.9 2.2L2 12h12l-1.1-1.3a3 3 0 0 1-.9-2.2V6a4 4 0 0 0-4-4z" fill="none" stroke={color} strokeWidth={1.3} />
    </Svg>
  ),
  subscription: (color) => (
    <Svg width={15} height={15} viewBox="0 0 16 16">
      <Circle cx={8} cy={8} r={6.3} fill="none" stroke={color} strokeWidth={1.3} />
      <Path d="M8 5v3.5l2.3 1.3" fill="none" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  ),
  settings: (color) => (
    <Svg width={15} height={15} viewBox="0 0 16 16">
      <Circle cx={8} cy={8} r={2} fill="none" stroke={color} strokeWidth={1.3} />
      <Path d="M8 1.5v2M8 12.5v2M2.5 8h2M11.5 8h2M4 4l1.4 1.4M10.6 10.6L12 12M12 4l-1.4 1.4M5.4 10.6L4 12" stroke={color} strokeWidth={1.3} strokeLinecap="round" />
    </Svg>
  ),
  chevronDown: (color) => (
    <Svg width={12} height={12} viewBox="0 0 16 16">
      <Path d="M4 6l4 4 4-4" stroke={color} strokeWidth={1.6} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  ),
  clock: (color) => (
    <Svg width={14} height={14} viewBox="0 0 16 16">
      <Circle cx={8} cy={8} r={6.5} fill="none" stroke={color} strokeWidth={1.4} />
      <Path d="M8 5v3l2 1.5" stroke={color} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </Svg>
  ),
};
