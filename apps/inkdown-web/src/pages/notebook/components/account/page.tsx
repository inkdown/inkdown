import { redirect } from "next/navigation";

export default function AccountPage() {
	const isUserLogged = true;

	if (!isUserLogged) {
		redirect("/login");
	}

	return <div>Account</div>;
}
