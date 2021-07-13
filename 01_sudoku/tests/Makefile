all:

clean:
	rm -f *~ *.bin *.bin.hex *.gz *.addr *.zip

play_on_sandbox:
	./00_init_sandbox.sh
	$(MAKE) play_tests

play_on_testnet:
	./00_init_testnet.sh
	$(MAKE) play_tests

play_tests:
	./01_prepare.sh
	./02_deploy.sh
	# ./03_new_problem.sh
	# ./04_new_user.sh
	# ./05_submit_user1.sh
	# ./06_submit_user2.sh
