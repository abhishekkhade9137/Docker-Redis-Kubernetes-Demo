import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cloud-Native Demo | Redis · Docker · Kubernetes',
  description:
    'Live demonstration of Redis caching (hit/miss), Docker containerisation, and Kubernetes deployment with autoscaling.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#090b10' }}>{children}</body>
    </html>
  );
}
