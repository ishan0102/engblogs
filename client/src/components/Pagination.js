import Select from 'react-select';

export default function Pagination({ page, totalPages, setPage }) {
  const handleChange = selectedOption => {
    setPage(selectedOption.value - 1);
    window.scrollTo(0, 0);
  };

  const options = Array.from({ length: totalPages }, (_, i) => ({ value: i + 1, label: i + 1 }));

  return (
    <div className="flex justify-center mt-6 mb-4">
      <button
        onClick={() => {
          setPage(page - 1);
          window.scrollTo(0, 0);
        }}
        disabled={page === 0}
        className="bg-indigo-500 hover:bg-indigo-600 text-white rounded disabled:opacity-50"
      >
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.25 8.75L9.75 12L13.25 15.25"></path>
        </svg>
      </button>

      <div className="px-2 mx-1">
        <Select
          instanceId="pagination"
          value={{ value: page + 1, label: page + 1 }}
          onChange={handleChange}
          options={options}
          isSearchable={false}
          className="rounded text-black"
          menuPlacement="auto"
        />
      </div>

      <button
        onClick={() => {
          setPage(page + 1);
          window.scrollTo(0, 0);
        }}
        disabled={page === totalPages - 1}
        className="bg-indigo-500 hover:bg-indigo-600 text-white rounded disabled:opacity-50"
      >
        <svg width="32" height="32" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M10.75 8.75L14.25 12L10.75 15.25"></path>
        </svg>
      </button>
    </div>
  )
}