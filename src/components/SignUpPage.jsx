import { useForm } from "react-hook-form";
export default function SignUpPage() {
    const { register, handleSubmit } = useForm();

    async function checkEmail() {
        
    }

    return (
        <div>
            <form>
                <inpu {...register("email", {required: true})} />
            </form>
        </div>
    );
}
