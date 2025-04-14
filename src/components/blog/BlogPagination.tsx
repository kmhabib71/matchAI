"use client";

import Link from "next/link";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface BlogPaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export default function BlogPagination({
  currentPage,
  totalPages,
  baseUrl,
}: BlogPaginationProps) {
  // Ensure baseUrl has the correct format for query parameters
  const baseUrlFormatted = baseUrl.includes("?")
    ? baseUrl.endsWith("&")
      ? baseUrl
      : `${baseUrl}&`
    : `${baseUrl}?`;

  // Function to generate page URLs
  const getPageUrl = (page: number) => `${baseUrlFormatted}page=${page}`;

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = [];

    // Always show first page
    pages.push(1);

    // Calculate range of pages to show around current page
    let start = Math.max(2, currentPage - 1);
    let end = Math.min(totalPages - 1, currentPage + 1);

    // Add ellipsis after first page if necessary
    if (start > 2) {
      pages.push("ellipsis1");
    }

    // Add pages around current page
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    // Add ellipsis before last page if necessary
    if (end < totalPages - 1) {
      pages.push("ellipsis2");
    }

    // Always show last page if there's more than one page
    if (totalPages > 1) {
      pages.push(totalPages);
    }

    return pages;
  };

  // Don't show pagination if there's only one page
  if (totalPages <= 1) {
    return null;
  }

  return (
    <nav aria-label="Blog Pagination" className="flex justify-center">
      <ul className="flex items-center space-x-1">
        {/* Previous Page Button */}
        <li>
          <Link
            href={currentPage === 1 ? "#" : getPageUrl(currentPage - 1)}
            className={`flex items-center px-3 py-2 rounded-md ${
              currentPage === 1
                ? "text-gray-400 cursor-not-allowed"
                : "text-purple-600 hover:bg-purple-50"
            }`}
            aria-disabled={currentPage === 1}
            tabIndex={currentPage === 1 ? -1 : undefined}
            onClick={(e) => currentPage === 1 && e.preventDefault()}
          >
            <FiChevronLeft size={20} />
            <span className="sr-only">Previous</span>
          </Link>
        </li>

        {/* Page Numbers */}
        {getPageNumbers().map((page, index) => (
          <li key={`${page}-${index}`}>
            {page === "ellipsis1" || page === "ellipsis2" ? (
              <span className="px-3 py-2 text-gray-500">...</span>
            ) : (
              <Link
                href={getPageUrl(page as number)}
                className={`px-3 py-2 rounded-md ${
                  currentPage === page
                    ? "bg-purple-600 text-white"
                    : "text-gray-700 hover:bg-purple-50"
                }`}
                aria-current={currentPage === page ? "page" : undefined}
              >
                {page}
              </Link>
            )}
          </li>
        ))}

        {/* Next Page Button */}
        <li>
          <Link
            href={
              currentPage === totalPages ? "#" : getPageUrl(currentPage + 1)
            }
            className={`flex items-center px-3 py-2 rounded-md ${
              currentPage === totalPages
                ? "text-gray-400 cursor-not-allowed"
                : "text-purple-600 hover:bg-purple-50"
            }`}
            aria-disabled={currentPage === totalPages}
            tabIndex={currentPage === totalPages ? -1 : undefined}
            onClick={(e) => currentPage === totalPages && e.preventDefault()}
          >
            <FiChevronRight size={20} />
            <span className="sr-only">Next</span>
          </Link>
        </li>
      </ul>
    </nav>
  );
}
