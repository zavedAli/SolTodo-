// useTodo.js
import * as anchor from "@project-serum/anchor";
import { useEffect, useMemo, useState } from "react";
import { TODO_PROGRAM_PUBKEY } from "../constants";
import todoIDL from "../constants/todo.json";
import toast from "react-hot-toast";
import { SystemProgram } from "@solana/web3.js";
import { utf8 } from "@project-serum/anchor/dist/cjs/utils/bytes";
import { findProgramAddressSync } from "@project-serum/anchor/dist/cjs/utils/pubkey";
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from "@solana/wallet-adapter-react";
import { authorFilter } from "../utils";

export function useTodo() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const anchorWallet = useAnchorWallet();

  const [initialized, setInitialized] = useState(false);
  const [lastTodo, setLastTodo] = useState(0);
  const [todos, setTodos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [transactionPending, setTransactionPending] = useState(false);
  const [input, setInput] = useState("");

  const program = useMemo(() => {
    if (anchorWallet) {
      const provider = new anchor.AnchorProvider(
        connection,
        anchorWallet,
        anchor.AnchorProvider.defaultOptions()
      );
      return new anchor.Program(todoIDL, TODO_PROGRAM_PUBKEY, provider);
    }
  }, [connection, anchorWallet]);

  useEffect(() => {
    const findProfileAccounts = async () => {
      if (program && publicKey && !transactionPending) {
        try {
          setLoading(true);
          const [profilePda, profileBump] = findProgramAddressSync(
            [utf8.encode("USER_STATE"), publicKey.toBuffer()],
            program.programId
          );
          const profileAccount = await program.account.userProfile.fetch(
            profilePda
          );

          if (profileAccount) {
            setLastTodo(profileAccount.lastTodo);
            setInitialized(true);

            const todoAccounts = await program.account.todoAccount.all([
              authorFilter(publicKey.toString()),
            ]);
            setTodos(todoAccounts);
          } else {
            console.log("NOT YET INITIALIZED");
            setInitialized(false);
          }
        } catch (error) {
          console.error("Error fetching profile accounts:", error);
          setInitialized(false);
          setTodos([]);
        } finally {
          setLoading(false);
        }
      }
    };
    findProfileAccounts();
  }, [publicKey, program, transactionPending]);

  const handleChange = (e) => {
    setInput(e.target.value);
  };

  const initializeUser = async () => {
    if (program && publicKey) {
      try {
        console.log("Initializing user...");
        setTransactionPending(true);
        const [profilePda, profileBump] = findProgramAddressSync(
          [utf8.encode("USER_STATE"), publicKey.toBuffer()],
          program.programId
        );

        const tx = await program.methods
          .initializeUser()
          .accounts({
            userProfile: profilePda,
            authority: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();

        console.log("User initialized, transaction:", tx);
        setInitialized(true);
        toast.success("Successfully initialized");
      } catch (error) {
        console.error("Error initializing user:", error);
        toast.error(`Initialization error: ${error.message}`);
      } finally {
        setTransactionPending(false);
      }
    }
  };

  const initializeStaticUser = () => {
    setInitialized(true);
  };

  const addTodo = async () => {
    if (program && publicKey) {
      try {
        setTransactionPending(true);
        const [profilePda, profileBump] = findProgramAddressSync(
          [utf8.encode("USER_STATE"), publicKey.toBuffer()],
          program.programId
        );
        const [todoPda, todoBump] = findProgramAddressSync(
          [
            utf8.encode("TODO_STATE"),
            publicKey.toBuffer(),
            Uint8Array.from([lastTodo]),
          ],
          program.programId
        );

        if (input) {
          await program.methods
            .addTodo(input)
            .accounts({
              userProfile: profilePda,
              todoAccount: todoPda,
              authority: publicKey,
              systemProgram: SystemProgram.programId,
            })
            .rpc();
          toast.success("succesfully add todo");
        }
      } catch (error) {
        console.log(error);
        toast.error(error.toString());
      } finally {
        setTransactionPending(false);
        setInput("");
      }
    }
  };

  const addStaticTodo = (e) => {
    e.preventDefault();
    if (input) {
      const newTodo = {
        account: {
          idx:
            todos.length > 0
              ? parseInt(todos[todos.length - 1].account.idx) + 1
              : 1,
          content: input,
          marked: false,
        },
      };
      setTodos([newTodo, ...todos]);
      setInput("");
    }
  };

  const markTodo = async (todoPda, todoIdx) => {
    if (program && publicKey) {
      try {
        setTransactionPending(true);
        setLoading(true);
        const [profilePda, profileBump] = findProgramAddressSync(
          [utf8.encode("USER_STATE"), publicKey.toBuffer()],
          program.programId
        );
        await program.methods
          .markTodo(todoIdx)
          .accounts({
            userProfile: profilePda,
            todoAccount: todoPda,
            authority: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        toast.success("Successfully mark todo");
      } catch (error) {
        console.log(error);
        toast.error(error.toString());
      } finally {
        setLoading(false);
        setTransactionPending(false);
      }
    }
  };

  const markStaticTodo = (todoID) => {
    setTodos(
      todos.map((todo) => {
        if (todo.account.idx === todoID) {
          return {
            account: {
              idx: todo.account.idx,
              content: todo.account.content,
              marked: !todo.account.marked,
            },
          };
        }
        return todo;
      })
    );
  };

  const removeTodo = async (todoPda, todoIdx) => {
    if (program && publicKey) {
      try {
        setTransactionPending(true);
        setLoading(true);
        const [profilePda, profileBump] = findProgramAddressSync(
          [utf8.encode("USER_STATE"), publicKey.toBuffer()],
          program.programId
        );
        await program.methods
          .removeTodo(todoIdx)
          .accounts({
            userProfile: profilePda,
            todoAccount: todoPda,
            authority: publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
        toast.success("Successfully remove todo");
      } catch (error) {
        console.log(error);
        toast.error(error.toString());
      } finally {
        setLoading(false);
        setTransactionPending(false);
      }
    }
  };

  const removeStaticTodo = (todoID) => {
    setTodos(todos.filter((todo) => todo.account.idx !== todoID));
  };

  const incompleteTodos = useMemo(
    () =>
      Array.isArray(todos) ? todos.filter((todo) => !todo.account.marked) : [],
    [todos]
  );

  const completedTodos = useMemo(
    () =>
      Array.isArray(todos) ? todos.filter((todo) => todo.account.marked) : [],
    [todos]
  );

  return {
    initialized,
    initializeStaticUser,
    loading,
    transactionPending,
    completedTodos,
    incompleteTodos,
    markStaticTodo,
    removeStaticTodo,
    addStaticTodo,
    input,
    setInput,
    handleChange,
    initializeUser,
    addTodo,
    markTodo,
    removeTodo,
  };
}

// Home.js
