input metauml;
beginfig(1);
	Actor.human("InteressentIn");

	Usecase.UOne("statistische", "Auswertung");

	leftToRight(50)(human, UOne);
	drawObjects(human, UOne);

	link(association)(pathStepX(human.e, UOne.w, 0));
endfig;
beginfig(2);
	Actor.leiter("WahlleiterIn");
	Actor.helfer("WahlhelferIn");

	Usecase.UTwo("Stimmen", "eintragen");

	leftToRight(50)(leiter, UTwo, helfer);
	drawObjects(leiter, helfer, UTwo);

	link(association)(pathStepX(leiter.e, UTwo.w, 0));
	link(association)(pathStepX(UTwo.e, helfer.w, 0));
endfig;
beginfig(3);
	Actor.waehler("WaehlerIn");

	Usecase.UThree("Stimme", "abgeben");

	leftToRight(50)(waehler, UThree, helfer);
	drawObjects(waehler, helfer, UThree);

	link(association)(pathStepX(waehler.e, UThree.w, 0));
	link(association)(pathStepX(UThree.e, helfer.w, 0));
endfig;
end
