import { useState,useEffect } from 'react';
import React from 'react';

export function Example() {
  // Declare a new state variable, which we'll call "count"
  const [count, setCount1] = useState(0);
  useEffect(() => {
    document.title = `You clicked ${count} times`;
  });
  return (
    <div>
      <p>You clicked {count} times</p>
      <button onClick={() => setCount1(count + 1)}>
        Click me
      </button>
    </div>
  );
}