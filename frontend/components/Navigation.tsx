"use client";
import { Compass, Shield, MessageSquare, User } from "lucide-react";
import { useState } from "react";

const Navigation = () => {
  const [activeNav, setActiveNav] = useState(1)
  const navItems = [
    {
      id: 1,
      name: "Explores Games",
      icon: <Compass />,
    },
    {
      id: 2,
      name: "Clubs and Squads",
      icon: <Shield />,
    },
    {
      id: 3,
      name: "Chats",
      icon: <MessageSquare />,
    },
    {
      id: 4,
      name: "Sports Passport",
      icon: <User />,
    },
  ];
  return (
    <div className="h-18 border-b-2 border-red-400 px-24 flex items-center justify-between">
      {/* Logo */}
      <div className="flex gap-2 items-center">
        <div className="bg-black h-fit w-fit p-2 rounded-lg">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            data-lucide="play"
            aria-hidden="true"
            className="lucide lucide-play w-6 h-6 fill-current text-[#9fe870]"
          >
            <path d="M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z"></path>
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="text-lg font-bold leading-normal">teamup</span>
          <span className="text-[#868685] font-bold text-xs leading-normal">
            SOCIAL FINDING
          </span>
        </div>
      </div>
      {/* Navbar */}
      <div className="bg-[#e8ebe6] flex gap-2 p-2 rounded-full">
      {navItems.map((item) => (
        <div key={item.id} className={`flex justify-center gap-1 rounded-full px-4 py-1.5
        ${activeNav == item.id ? 'bg-white' : ''}`}>
          {item.icon}
          <span className="text-sm font-medium">
            {item.name}
          </span>
        </div>
      ))}
      </div>

    </div>
  );
};

export default Navigation;
