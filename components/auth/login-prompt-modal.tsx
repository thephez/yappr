'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { useLoginPromptModal, getActionDescription } from '@/hooks/use-login-prompt-modal'
import { useLoginModal } from '@/hooks/use-login-modal'

export function LoginPromptModal() {
  const { isOpen, action, close } = useLoginPromptModal()
  const openLoginModal = useLoginModal((s) => s.open)

  const handleLogin = () => {
    close()
    openLoginModal()
  }

  const actionDescription = getActionDescription(action)

  return (
    <Dialog.Root open={isOpen} onOpenChange={close}>
      <AnimatePresence>
        {isOpen && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
              >
                <Dialog.Content asChild>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-white dark:bg-neutral-900 rounded-2xl p-6 w-[400px] max-w-[90vw] shadow-xl relative"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Dialog.Title className="text-xl font-bold mb-2 flex items-center gap-2">
                      <UserCircleIcon className="h-6 w-6 text-yappr-500" />
                      Log in to continue
                    </Dialog.Title>

                    <Dialog.Description className="text-gray-600 dark:text-gray-400 mb-6">
                      You need to be logged in to {actionDescription}. Log in now to join the conversation.
                    </Dialog.Description>

                    <button
                      onClick={close}
                      className="absolute top-4 right-4 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>

                    <div className="flex flex-col gap-3">
                      <Button onClick={handleLogin} className="w-full">
                        Log in
                      </Button>
                      <Button onClick={close} variant="outline" className="w-full">
                        Maybe later
                      </Button>
                    </div>

                    <p className="mt-4 text-center text-sm text-gray-500">
                      Don&apos;t have an account?{' '}
                      <button
                        onClick={handleLogin}
                        className="text-yappr-500 hover:underline"
                      >
                        Create one
                      </button>
                    </p>
                  </motion.div>
                </Dialog.Content>
              </motion.div>
            </Dialog.Overlay>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  )
}
