import { currentUser } from "@clerk/nextjs/server"
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar"


async function UserInformation() {
  const user=await currentUser()
  return (
    <Avatar>
      {user?.id? (<AvatarImage src={user?.imageUrl}/>):(<AvatarImage src="https://github.com/shadcn.png"/>)}
      <AvatarFallback>{user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}</AvatarFallback>
    </Avatar>
  )
}
export default UserInformation