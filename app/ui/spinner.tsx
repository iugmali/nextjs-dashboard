import {twMerge} from "tailwind-merge";

export const Spinner = ({className}: {className?: string}) => {
  return (
    <div className={twMerge(`rounded-full w-16 h-16 border-blue-500 border-t-4 border-l-4 animate-spin`, className || '')} />
  );
}

export const SpinnerCentered = () => {
  return (
    <div className={`grid h-full place-content-center`}>
      <Spinner />
    </div>
  )
}
