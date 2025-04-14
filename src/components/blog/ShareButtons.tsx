"use client";

import {
  FiTwitter,
  FiFacebook,
  FiLinkedin,
  FiMail,
  FiLink,
} from "react-icons/fi";

interface ShareButtonsProps {
  url: string;
  title: string;
}

export default function ShareButtons({ url, title }: ShareButtonsProps) {
  // Encode the URL and title for sharing
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  // Share URLs for different platforms
  const twitterUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
  const emailUrl = `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;

  // Copy to clipboard function
  const copyToClipboard = () => {
    navigator.clipboard.writeText(url);
    alert("Link copied to clipboard!");
  };

  // Share button component
  const ShareButton = ({
    href,
    onClick,
    icon,
    label,
  }: {
    href?: string;
    onClick?: () => void;
    icon: React.ReactNode;
    label: string;
  }) => (
    <a
      href={href}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault();
          onClick();
        } else if (href) {
          e.preventDefault();
          window.open(
            href,
            "_blank",
            "noopener,noreferrer,width=600,height=400"
          );
        }
      }}
      className="text-gray-500 hover:text-purple-600 p-2 rounded-full hover:bg-purple-50 transition-colors"
      aria-label={label}
      title={label}
    >
      {icon}
    </a>
  );

  return (
    <div className="flex space-x-2">
      <ShareButton
        href={twitterUrl}
        icon={<FiTwitter size={20} />}
        label="Share on Twitter"
      />
      <ShareButton
        href={facebookUrl}
        icon={<FiFacebook size={20} />}
        label="Share on Facebook"
      />
      <ShareButton
        href={linkedinUrl}
        icon={<FiLinkedin size={20} />}
        label="Share on LinkedIn"
      />
      <ShareButton
        href={emailUrl}
        icon={<FiMail size={20} />}
        label="Share via Email"
      />
      <ShareButton
        onClick={copyToClipboard}
        icon={<FiLink size={20} />}
        label="Copy Link"
      />
    </div>
  );
}
