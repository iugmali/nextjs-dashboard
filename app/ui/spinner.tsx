export const Spinner = ({h, w, color}: {h?: string, w?:string, color?: string}) => {
  return (
    <div className={`rounded-full w-${w ? w : '16'} h-${h ? h : '16'} border-${color ? color : 'blue-500'} border-t-4 border-l-4 animate-spin`} />
  );
}

export const SpinnerCentered = () => {
  return (
    <div className={`fixed h-full w-full grid place-content-center`}>
      <Spinner />
    </div>
  )
}
