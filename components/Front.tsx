"use client"

import { SignedIn, SignedOut, SignInButton, useUser } from "@clerk/nextjs"
import Image from "next/image"
import { Button } from "./ui/button"
import Logo from "../image/Logo.png"
import Book from "../image/Book.jpg"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function Front() {
  const router = useRouter()

  return (
    <main className="flex h-screen w-screen relative">

      <div className="absolute left-2/5 top-0 h-full w-[2px] bg-gray-300 z-10 hidden md:block"></div>

      <div className="w-2/5 relative hidden md:block">
        <Image
          src={Logo}
          alt="Website Logo"
          fill
          priority
          className="object-cover"
        />
      </div>


      <div className="w-full md:w-3/5 relative flex justify-center items-center">
        <Image
          src={Book}
          alt="Background"
          fill
          className="object-cover blur-sm"
        />


        <div className="absolute flex flex-col items-center gap-6 p-8 md:p-10 bg-white/30 backdrop-blur-md rounded-3xl shadow-2xl border border-white/40 w-[90%] max-w-sm animate-fadeIn">

          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 drop-shadow-md tracking-wide text-center">
            You <span className="text-pink-500">start</span> here
          </h1>

          <p className="text-gray-800 text-center text-sm md:text-base max-w-xs">
            Dive into your lectures and summaries effortlessly. Let’s get started!
          </p>

          <SignedOut>
            <SignInButton mode="modal">
              <Button className="px-8 py-3 bg-pink-500 text-white font-semibold rounded-full shadow-lg hover:bg-pink-600 hover:scale-105 transition-all duration-300">
                Sign In
              </Button>
            </SignInButton>
          </SignedOut>

          <SignedIn>
            <RedirectToMain router={router} />
          </SignedIn>

        </div>
      </div>
    </main>
  )
}

function RedirectToMain({ router }: { router: ReturnType<typeof useRouter> }) {
  const { user } = useUser()

  useEffect(() => {
    if (user) router.push(`/main/${user.id}`)
  }, [user, router])

  return null
}
