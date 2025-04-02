import React from "react";

function Spinner() {
  return <div className='loader'>Loading...</div>;
}

const MemoizedSpinner = React.memo(Spinner);
export default MemoizedSpinner;
