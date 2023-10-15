import { useState, useEffect } from 'react';

export default function Support(props) {
  return (
    <div className="flex flex-col justify-center items-center">
      <div className="p-8 bg-white rounded-xl shadow-xl max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4">Support</h1>
        <p>If you're experiencing issues with engblogs, we're here to help! Please leave a email <a className="text-indigo-500"href="mailto:ishan0102@gmail.com, ishan0102@gmail.com?subject=Engblogs Support Request">ishan0102@gmail.com</a>
        </p>

        <div className="flex justify-between mt-4">
          <a
            href="https://apps.apple.com/app/id6457546082"
            className="bg-indigo-500 text-white p-2 rounded hover:bg-indigo-600"
            target="_blank" rel="noopener noreferrer"
          >
            View on App Store
          </a>
        </div>
      </div>
    </div>
  );
}
