let pi =print_int
let ps = print_string
let pn = print_newline

let instances = 1
let m = 3
let n = m*m

let in_domain n x =  (0 <= x && x <= n-1)
let in_domain_pair n (i,j) = in_domain n i && in_domain n j

let check_line_add n sudoku (i,j) x =
  let k = ref 0 in
  while (!k < n && (sudoku.(i).(!k) <> x || !k = j)) do
    incr(k)
  done;
  !k=n

let check_row_add n sudoku (i,j) x =
  let k = ref 0 in
  while (!k < n && (sudoku.(!k).(j) <> x || !k = i)) do
    incr(k)
  done;
!k=n

let box_of_square n (i,j) = (i/m,j/m)

let check_box_add n sudoku (i,j) x =
  let (k,l) = box_of_square n (i,j) in
  let var = ref 0 in
  let get_couple_from_var x = (!x / m,!x - (!x / m) * m) in
  let s = ref 0 in
  let t = ref 0 in
  while(!var <= n && (sudoku.(k*m+ !s).(l*m+ !t) <> x || (i,j) = (k*m+ !s,l*m+ !t))) do
    let (a,b) = get_couple_from_var var in
    s :=a; t := b;
    incr(var)
  done;
  !var = n+1

let check sudoku n (i,j) x = check_line_add n sudoku (i,j) x && check_row_add n sudoku  (i,j) x && check_box_add n sudoku (i,j) x

let next1step sudoku n (i,j) =
    if i=n-1 && j=n-1 then
      (-1,-1)
    else
      if j=n-1 then
	(i+1,0)
      else
	(i,j+1)

let next sudoku n (i,j) =
  let rec aux = function
    | (-1,-1) -> (-1,-1)
    | (u,v) when sudoku.(u).(v) = 0 -> (u,v)
    | (u,v) -> let (u1,v1) = next1step sudoku n (u,v) in  aux (u1,v1)
  in
  aux (next1step sudoku n (i,j))

let get_first sudoku n = let res = if sudoku.(0).(0) = 0 then (0,0) else next sudoku n (0,0) in
res

let print_pair (u,v) = pi u; ps " "; pi v; pn ()

let backtrack n sudoku =
  match get_first sudoku n with
  | (-1,-1) -> true
  | (i0,j0) ->
  let rec try_square (i,j) =
    if (i,j) = (-1,-1) then true else
    match sudoku.(i).(j) with
    | u when u=n -> false
    | k when (0 <= k && k <= n-1) ->
      begin
	sudoku.(i).(j) <- k+1;
	let (u,v) = next sudoku n (i,j) in
	  begin
	    let b = check sudoku n (i,j) (k+1) in
	    if not(b && try_square (u,v)) then
	      if sudoku.(i).(j) = n then
		begin
		  sudoku.(i).(j) <- 0;
		  false
		end
	      else
		try_square (i,j)
	    else
	      true
	  end
      end
    | k -> check sudoku n (i,j) (k)
  in
try_square (i0,j0)

let explode s =
  let rec exp i l =
    if i < 0 then l else exp (i - 1) (s.[i] :: l) in
  exp (String.length s - 1) []

let print_sudoku sudoku =
  pn ();
  Array.iter (fun t -> Array.iter (fun x -> pi x; ps " ") t; pn()) sudoku

let retrieve_corner sudoku n =
  let get i = sudoku.(0).(i) in
  (get 0)*100 + (get 1) * 10 + (get 2)

let res = ref 0

let input() =
  (* for i = 0 to instances-1 do *)
    let _ = input_line stdin in
    let t = Array.init n (fun _ -> input_line stdin) in
    let sudoku = Array.map (fun s -> Array.of_list (List.map (fun x -> int_of_char x - int_of_char '0') (explode s))) t in
    ignore (backtrack n sudoku);
    res := !res + retrieve_corner sudoku n;
    (* print_sudoku sudoku *)
  (* done; *)
    sudoku

(* pretty printer for smart contract input *)
let instance_as_fixed_value_array sudoku =
  let res = ref "" in
  for i = 0 to n-1 do
    for j = 0 to n-1 do
      if sudoku.(i).(j) <> 0 then
        res := Printf.sprintf "{ \"i\" : \"%d\", \"j\" : \"%d\", \"value\" : \"%d\"}, %s" i j sudoku.(i).(j) !res;
    done
  done;
  Printf.sprintf "[%s]" !res

let _ =
  let sudoku = input () in
  Printf.printf "%s" (instance_as_fixed_value_array sudoku);
  ignore (backtrack n sudoku);
  print_sudoku sudoku
