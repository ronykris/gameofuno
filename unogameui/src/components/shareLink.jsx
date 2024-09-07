import FrameBox from './frameBox'
import StyledButton from './styled-button'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { CopyToClipboard } from 'react-copy-to-clipboard'
import { FaRegCopy } from "react-icons/fa";

export default function ShareLink({ onClose, link }) {
  const router = useRouter()
  const [url, setUrl] = useState(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const currentUrl = new URL(link, location.origin)
    setUrl(currentUrl.toString())
  }, [])

  return (
    <FrameBox
      title={<div className='bg-[url("/title-share.png")] bg-no-repeat bg-top h-[96px] -translate-y-1/2'></div>}
      onClose={onClose}
      showClose={false}
      data-testid="share link"
    >
      <div className='w-[560px] m-10 mb-4 text-center text-white'>
        <h4 className='text-3xl font-black'>Match created!</h4>
        <p>Instructions for sharing the match.</p>
        <div className='flex items-center gap-8'>
          <img className='icon' src='/share-link-icon.png' />
          <span>
            <p>Information about the match. Click to copy</p>
            <p className='text-[#fff000] cursor-pointer'>
              <CopyToClipboard text={url}
                onCopy={() => { setCopied(true); setTimeout(() => setCopied(false), 3000) }}>
                <a className='relative underline'>
                  {url}
                  {copied && <FaRegCopy className='absolute -right-5 top-1 w-4 h-4' />}
                </a>
              </CopyToClipboard>
            </p>
          </span>
        </div>
      </div>
      <div className='flex justify-center'>
        <StyledButton className='bg-[#ff9000] m-2' roundedStyle='rounded-full' onClick={() => { router.push(link) }}>
          <div className='text-2xl' >LET'S GO</div>
        </StyledButton>
      </div>
    </FrameBox>
  )
}