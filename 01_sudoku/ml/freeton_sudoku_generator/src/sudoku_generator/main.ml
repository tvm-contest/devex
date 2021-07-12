type variable = Var of string * int list

let var_one = Var("one",[])

(* variable with coefficient *)
type lc_single = int*variable
(* linear combination *)
type lc = lc_single list

let os_list ?(fst_sep=true) os op sep cp l =        (* op, cp = opening, closing parentheses *)
  let rec aux ?(init=false) res = function
    | [] -> Printf.sprintf "%s%s" res cp
    | [x] -> Printf.sprintf "%s%s%s%s" res sep (os x) cp
    | x::xs -> aux (Printf.sprintf "%s%s%s" res (if init then "" else sep)
                      (os x)) xs
  in aux ~init:fst_sep op l

let os_index_intlist (il : int list) = os_list ~fst_sep:false string_of_int "" "_" "" il

let os_var (Var(s,il)) = if s="one" then "1" else
                           Printf.sprintf "%s%s" s (os_index_intlist il)

let os_var' (Var(s,_) as v) =
  if s="one" then "1" else
    Printf.sprintf "this->bp.val(%s)" (os_var v)


let os_single_lc ?(os_v=os_var) (i,v) =
  if i = 1 then os_v v else
  Printf.sprintf "(%d) * (%s)" i (os_v v)

let os_lc ?(os_v=os_var) (l : lc) =
  match l with
  | [] -> "0"
  | [x] -> os_single_lc ~os_v x
  | l -> os_list (os_single_lc ~os_v) "(" "+" ")" l

let os_lc' = os_lc ~os_v:os_var'


(* let _ = print_string (os_var (Var("X",[3;4;5]))) *)

let generate_interval i j f =
  assert(i < j);
  (* i <= k < j *)
  let rec aux res = function
    | x when x=i -> ((f x)::res)
    | x when x<i -> failwith "never happens: x<i"
    | x -> aux ((f x)::res) (x-1)
  in aux [] (j - 1)



(* let toto () = print_string (os_var (get_fresh_variable ())) *)

type variables = variable list

type equation = Product3 of lc * lc * lc
              | Product2 of lc * lc

type state =
  {
    sudoku_size_param : int;          (* 3 for a 9 by 9 sudoku *)
    fresh_index : int;
    private_variables : variables;
    public_variables : variables;
    equations : equation list;
    private_definitions : equation list
    (* definition of intermediate
       values *)
  }


let get_fresh_index state =
  let res = state.fresh_index in
  {state with fresh_index = res + 1}, res

let get_fresh_variable state =
  let state, res = get_fresh_index state in
  let newvar = Var ("aux",[res]) in
  newvar, {state with
            private_variables =
              newvar::state.private_variables}

let add_equations state equations =
  {state with equations = List.concat [state.equations;equations]}

(* takes X1 * X2 * ... * X_n = RES and builds intermediate variables
   and corresponding equations for blueprint *)
let create_equations state (lcs_to_multiply : lc list) (result : lc) =
  let rec aux state lcs_to_multiply result =
  match lcs_to_multiply with
  | [] -> failwith "don't play with me, empty product"
  | [x] -> add_equations state [Product2 (x,result)]
  | [x;y] -> add_equations state [Product3 (x,y,result)]
  | x::y::z ->
     let interm_var,state = get_fresh_variable state in
     let state = aux state [x;y] [1,interm_var] in
     let state = aux state ([1,interm_var]::z) result in
     {state with private_definitions = (Product3 (x,y,[1,interm_var]))::state.private_definitions}
  in
  aux state lcs_to_multiply result

(* oc is for output_code *)

let oc_define_blueprint_variables prefixe ~const variables =
  let rec aux res = function
    | [] -> Printf.sprintf "%s\n" res
    | x::xs ->
       aux
         (Printf.sprintf "%s%!\n    \
                              %sblueprint_variable<field_type> %s;"
            res (if const then "const " else "") (os_var x)) xs
    in aux prefixe variables

let oc_allocate_blueprint_variables prefixe ~this variables =
  let rec aux res = function
    | [] -> Printf.sprintf "%s\n" res
    | x::xs ->
       aux
         (Printf.sprintf "%s%!\n    \
                              %s.allocate(%sbp);"
            res
            (os_var x)
            (if this then "this->" else "")) xs

    in aux prefixe variables

let oc_push_public_variables prefixe variables =
  let rec aux res = function
    | [] -> Printf.sprintf "%s\n" res
    | x::xs ->
       aux
         (Printf.sprintf "%s%!\n    \
                              %svariables.push_back(&%s);"
            res
            (match x with
             | Var("free_x",_) -> "free_"
             | _ -> "")
            (os_var x)
            ) xs

    in aux prefixe variables


let oc_equation = function
  | Product2(x,res) ->
    Printf.sprintf
      "  this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(%s, 1, %s));"
      (os_lc x) (os_lc res)
  | Product3(x,y,res) ->
     Printf.sprintf
       "  this->bp.add_r1cs_constraint(r1cs_constraint<field_type>(%s, %s, %s));"
       (os_lc x) (os_lc y) (os_lc res)

let oc_private_definition = function
  | Product2(x,res) ->
    Printf.sprintf
      "  %s = %s;"
      (os_lc' res) (os_lc' x)
  | Product3(x,y,res) ->
     Printf.sprintf
       "  %s = (%s) * (%s);"
       (os_lc' res) (os_lc' x) (os_lc' y)

let oc_private_definitions equations =
  Printf.sprintf
    "\n%s\n"
    (os_list oc_private_definition "" "\n    " "" equations)

let oc_equations equations =
  Printf.sprintf
    "\n%s\n"
    (os_list oc_equation "" "\n    " "" equations)


(* generate sudoku of size n^2 (n^4 squares) variables and equations
   *)

(* equations (xij - 1) * ... (xij - n^2) *)
let generate_equation n i j : lc list * lc =
  let n2 = n*n in
  let var = Var("x",[i;j]) in
  List.map (fun k -> [1,var;(-k,Var("one",[]))])
    (generate_interval 1 (n2+1) (fun i -> i)),[]

(* (\* equations free_xij (free_xij - 1) * ... (free_xij - n^2) where free_xij are the
 *    fixed variable values (possibly 0, contrary to xij) *\)
 * let generate_fixed_equation n i j : lc list * lc =
 *   let n2 = n*n in
 *   let var = Var("free_x",[i;j]) in
 *   List.map (fun k -> [1,var;(-k,Var("one",[]))])
 *     (generate_interval 0 (n2+1) (fun i -> i)),[] *)

(* The variables generated by the two next functions are actually
   private *)
let generate_variables m =
  generate_interval 0 m
    (fun i ->
      generate_interval 0 m
        (fun j ->
          Var("x",[i;j])))

let generate_fixed_variables_square m =
  List.concat @@ generate_interval 0 m
    (fun i ->
      generate_interval 0 m
        (fun j ->
          [Var("free2_x",[i;j])]))

(* The fixed variables are public, they are the public constraints on
   the sudoku board that everyone can see *)
let generate_fixed_variables m =
  List.concat @@ generate_interval 0 m
    (fun i ->
      generate_interval 0 m
        (fun j ->
          [Var("free_x",[i;j])]))

let generate_indices m =
  List.concat @@
    generate_interval 0 m
      (fun i ->
        generate_interval 0 m
      (fun j -> (i,j)))

let sudoku_public_variables n = (List.concat (generate_fixed_variables (n*n))) @ (List.concat (generate_variables (n*n)))

let sudoku_private_variables n = (List.concat (generate_fixed_variables_square (n*n)))

let generate_value_equations n =
  List.map (fun (i,j) -> generate_equation n i j)
    (generate_indices (n*n))

(* let generate_fixed_value_equations n =
 *   List.map (fun (i,j) -> generate_fixed_equation n i j)
 *     (generate_indices (n*n)) *)


let sudoku_public_variables_2 = sudoku_public_variables 2
let sudoku_public_variables_3 = sudoku_public_variables 3

let prodn n =
  let rec aux res = function
    | 0 -> res
    | k -> aux (k*res) (k-1) in
  aux 1 n

let prodn2 n =
  prodn (n*n)

let generate_row n i =
  let n2 = n*n in
    List.map (fun j -> [1,Var("x",[i;j]);])
    (generate_interval 0 n2 (fun j -> j)),[(prodn2 n,var_one)]

let generate_rows n =
  let n2 = n*n in
  generate_interval 0 n2 (fun i -> generate_row n i)

let generate_col n j =
  let n2 = n*n in
    List.map (fun i -> [1,Var("x",[i;j]);])
    (generate_interval 0 n2 (fun i -> i)),[(prodn2 n,var_one)]

let generate_cols n =
  let n2 = n*n in
  generate_interval 0 n2 (fun j -> generate_col n j)

let generate_box n i j =
  let n2 = n * n in
  assert (i < n2); assert (j < n2);
  List.map (fun var -> [1,var])
  @@
    List.concat (generate_interval i (i+n)
    (fun i ->
      generate_interval j (j+n)
        (fun j ->
          Var("x",[i;j])))),[(prodn2 n,var_one)]

let generate_boxes n =
  List.concat
    (generate_interval 0 n (fun i ->
    generate_interval 0 n (fun j -> generate_box n (i*n) (j*n))))

(* generate all the free_xij * xij = free_xij * free_xij, that is to
   say:
   free_xij * free_xij =def free2_xij
   and
   free_xij * xij = free2_xij
 *)
let generate_fixed_value_to_value_equations i j =
  Product3([1,Var("free_x",[i;j])],[1,Var("x",[i;j])],[1,Var("free2_x",[i;j])])

let generate_fixed_value_square_definitions i j =
  Product3 ([1,Var("free_x",[i;j])],[1,Var("free_x",[i;j])],[1,Var("free2_x",[i;j])])

let generate_all_fixed_value_equations n =
  let n2 = n*n in
  List.concat
    (generate_interval 0 n2 (fun i ->
         generate_interval 0 n2 (fun j ->
             generate_fixed_value_to_value_equations i j)))

let generate_all_fixed_value_definitions n =
  let n2 = n*n in
  List.concat
    (generate_interval 0 n2 (fun i ->
         generate_interval 0 n2 (fun j ->
             generate_fixed_value_square_definitions i j)))

let build_sudoku_state n : state =
  let init_state = {
      sudoku_size_param = n;
      fresh_index = 0;
      public_variables = sudoku_public_variables n;
      private_variables = sudoku_private_variables n;
      equations = (generate_all_fixed_value_equations n);
      private_definitions = generate_all_fixed_value_definitions n
    } in
  List.fold_right
    (fun (prod,res) state -> create_equations state prod res)
         ((generate_rows n)@(generate_cols n)@(generate_boxes n)@(generate_value_equations n)) init_state


let oc_arguments_test_components variables =
  os_list ~fst_sep:false os_var "" ",\n const blueprint_variable<field_type> &" "" variables

let oc_arguments_test_components2 variables =
  let rec aux res = function
    | [] -> res
    | [x] -> Printf.sprintf "%s,%s (%s)" res (os_var x) (os_var x)
    | x::xs -> aux (Printf.sprintf "%s,%s (%s)" res (os_var x) (os_var x)) xs in
  aux "" variables

let oc_arguments variables =
  os_list ~fst_sep:false os_var "" "," "" variables


let oc_state state name =
  let hpp_file = Printf.sprintf "../../../ton-proof-verification-contest/bin/cli/src/%s.hpp" name in
  let cpp_file = Printf.sprintf "../../../ton-proof-verification-contest/bin/cli/src/%s.cpp" name in
  (* let res = Printf.sprintf "%s %s %s"
   * (oc_define_blueprint_variables "//private (intermediary) variables\n"
   *    state.private_variables)
   * (oc_define_blueprint_variables "//public variables\n"
   *    state.public_variables)
   * (oc_equations state.equations) *)
  EzFile.write_file hpp_file (Main_hpp.big_fat_hpp ~name
    (oc_define_blueprint_variables "//private (intermediary) variables\n"
       ~const:false state.private_variables)
    (oc_define_blueprint_variables "//public variables\n"
       ~const:true state.public_variables)
    ~arguments_test_component:(oc_arguments_test_components state.public_variables)
    ~arguments_test_component2:(oc_arguments_test_components2 state.public_variables)
    ~allocate_private_variables:
    (oc_allocate_blueprint_variables
       "//allocate private variables to blueprint"
       ~this:true
    state.private_variables)
    ~equations:(oc_equations state.equations)
    ~r1cs_witness:(oc_private_definitions state.private_definitions));
  EzFile.write_file cpp_file (Main_cpp.big_fat_cpp ~name
    (oc_define_blueprint_variables "//private (intermediary) variables\n"
       ~const:false state.public_variables)
    ~allocate_public_variables:
    (oc_allocate_blueprint_variables
       "//allocate public variables to blueprint"
       ~this:false
       state.public_variables)
    ~public_variable_arguments:
    (oc_arguments state.public_variables)
  ~sudoku_size:(state.sudoku_size_param * state.sudoku_size_param)
  ~push_public_variables:(oc_push_public_variables "" state.public_variables))

let sudoku = build_sudoku_state (int_of_string Sys.argv.(1))

let _ = oc_state sudoku "sudoku"

(* let _ = print_string Main_cpp.big_fat_cpp
 * let _ = print_string (Main_hpp.big_fat_hpp "sudoku") *)
