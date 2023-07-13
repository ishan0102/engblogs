import { useState } from 'react';

export default function Search({ onSearch }) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearchTerm = (event) => {
    const searchedTerm = event.target.value;

    if (searchedTerm.length === 0) {
      setSearchTerm(searchedTerm);
      onSearch(searchTerm);
    }
  };

  return (
    <div className="flex justify-center mt-6 mb-4">
      <input
        id="search"
        className="text-gray-500 border border-gray-300 hover:border-gray-400 placeholder-gray-500 rounded px-2 py-1.5"
        type='text'
        onChange={handleSearchTerm}
        onKeyDown={(event) => {
          if ((event.key === "Enter")) {
            if (event.target.value.length > 0) {
              onSearch(event.target.value)
            }
          }
        }}
        placeholder='search posts'
      />
    </div>
  );
}   