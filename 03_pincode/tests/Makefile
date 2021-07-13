all:

play_on_sandbox:
	./00_init_sandbox.sh
	$(MAKE) play_tests

play_tests:
	./01_prepare.sh
	./02_deploy.sh
	./03_get.sh
	./04_replace.sh
	./05_update_multisig.sh

clean:
	rm -f *~ *.bin *.hex
