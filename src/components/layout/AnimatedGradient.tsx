'use client';

const AnimatedGradient = () => {
  return (
    <div className="fixed inset-0 -z-10 h-screen w-screen">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-50 animate-gradient-xy"></div>
    </div>
  );
};

export default AnimatedGradient; 