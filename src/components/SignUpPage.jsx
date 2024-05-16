import { useForm } from "react-hook-form";
import { invoke } from "@tauri-apps/api/core";
import "../styles/SignUpPage.css";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
export default function SignUpPage() {
    const {
        register,
        handleSubmit,
        watch,
        formState: { errors },
    } = useForm();

    const navigate = useNavigate();

    async function checkEmail(email) {
        return invoke("check_email", { email: email })
            .then((res) => {
                console.log(res);
                return !res;
            })
            .catch((e) => {
                return true;
            });
    }

    async function checkUsername(username) {
        return invoke("check_username", { username: username })
            .then((res) => {
                console.log(res);
                return !res;
            })
            .catch((e) => {
                return true;
            });
    }

    async function onSubmit(val) {
       invoke("signup", {
        email: val.email,
        username: val.username,
        password: val.password
       }).then(() => {
        navigate("/login")
       }).catch(e => {
        alert("Server error! Please try again.")
       })
    }

    return (
        <div className="signup-page">
            <form onSubmit={handleSubmit(onSubmit)}>
                <label htmlFor="signup-email">Email</label>
                <input
                    id="signup-email"
                    placeholder="email"
                    {...register("email", {
                        required: true,
                        validate: async (value) => await checkEmail(value),
                        pattern: {
                            value: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                            message: "Invalid email address",
                        },
                    })}
                    aria-invalid={errors.email ? "true" : "false"}
                />
                {errors.email?.type === "required" && (
                    <p className="error-msg" role="alert">
                        Email is required
                    </p>
                )}
                {errors.email?.type === "validate" && (
                    <p className="error-msg" role="alert">
                        This email has already been registered
                    </p>
                )}
                {errors.email?.type === "pattern" && (
                    <p className="error-msg" role="alert">
                        {errors.email.message}
                    </p>
                )}

                <label htmlFor="signup-username">Username</label>
                <input
                    id="signup-username"
                    placeholder="username"
                    {...register("username", {
                        required: true,
                        validate: async (value) => await checkUsername(value),
                    })}
                    aria-invalid={errors.username ? "true" : "false"}
                />

                {errors.username?.type === "required" && (
                    <p className="error-msg" role="alert">
                        Username is required
                    </p>
                )}
                {errors.username?.type === "validate" && (
                    <p className="error-msg" role="alert">
                        This username has already been registered
                    </p>
                )}

                <label htmlFor="signup-password">Password</label>
                <input
                    type="password"
                    id="signup-password"
                    placeholder="password"
                    {...register("password", {
                        required: true,
                        pattern: {
                            value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%]).{8,24}$/,
                            message: "Password is not secure enough",
                        },
                    })}
                    aria-invalid={errors.password ? "true" : "false"}
                />

                {errors.password?.type === "required" && (
                    <p className="error-msg" role="alert">
                        Password is required
                    </p>
                )}
                {errors.password?.type === "pattern" && (
                    <p className="error-msg" role="alert">
                        {errors.password.message}
                    </p>
                )}

                <label htmlFor="signup-reenter-password">
                    Confirm your password
                </label>
                <input
                    type="password"
                    id="signup-reenter-password"
                    placeholder="enter your password again"
                    {...register("reenterPassword", {
                        required: true,
                        validate: (value) => watch("password") === value,
                    })}
                    aria-invalid={errors.reenterPassword ? "true" : "false"}
                />

                {errors.reenterPassword?.type === "required" && (
                    <p className="error-msg" role="alert">
                        Password didn't match the first one
                    </p>
                )}

                {errors.reenterPassword?.type === "validate" && (
                    <p className="error-msg" role="alert">
                        Password didn't match the first one
                    </p>
                )}

                <div className="button-area">
                    <Button
                        type="submit"
                        variant="contained"
                    >
                        Submit
                    </Button>
                    <Button onClick={() => { navigate("/login") }} color="error" variant="outlined">Cancel</Button>
                </div>
            </form>
        </div>
    );
}
